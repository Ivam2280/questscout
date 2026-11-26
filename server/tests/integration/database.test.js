const { before, after, test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, createHmac } = require("node:crypto");
const { Client } = require("pg");

if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a dedicated PostgreSQL database whose name ends in _test.");
if (!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")) throw new Error("Refusing to run destructive tests outside a dedicated _test database.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DIRECT_DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-only-secret-at-least-thirty-two-characters";
process.env.DEMO_PAYMENTS = "true";
process.env.RESEND_API_KEY = "";
process.env.EMAIL_FROM = "";
for (const name of ["SMTP_USER", "SMTP_PASSWORD", "SMTP_PASS", "EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]) process.env[name] = "";
process.env.MAIL_PROVIDER = "auto";
for (const name of ["FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET", "FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_APP_ID"]) process.env[name] = "";
process.env.ADMIN_EMAIL = "";
process.env.ADMIN_PASSWORD = "";
const sequelize = require("../../config/connection");
const { postgresOptions } = require("../../config/postgres");
const { migrate } = require("../../db/migrate");
const { seedDatabase } = require("../../seeds/seed");
const { User, EscapeRoom, Booking, Review } = require("../../models");
const { DateTime } = require("luxon");
const { createBooking, expireBookings } = require("../../services/bookings");
const { authMutations, verifyChallenge } = require("../../services/auth");
const { signInWithGoogle } = require("../../services/google");
const { paymentMutations } = require("../../services/payments");
const { authMiddleware, signToken } = require("../../utils/auth");
const { createApp } = require("../../app");
const { env, validateServerEnv } = require("../../config/env");
let room, user, context, server;
const tomorrow = () => DateTime.now().setZone("Europe/Kyiv").plus({ days: 1 }).toISODate();

before(async () => {
  const client = new Client(postgresOptions(process.env.TEST_DATABASE_URL));
  await client.connect();
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
  await client.end();
  await migrate();
  await seedDatabase();
  room = await EscapeRoom.findOne({ where: { duration: 60 } });
  user = await User.create({ firstName: "Test", lastName: "Visitor", email: "visitor@example.test", password: "strong-test-password", hasPassword: true });
  context = { user: { id: user.id, isAdmin: false } };
});
after(async () => { if (server) await server.apollo.stop(); await sequelize.close(); });

test("migrations and seeding are repeatable without losing data or resetting passwords", async () => {
  const counts = await Promise.all([User.count(), EscapeRoom.count(), Review.count(), Booking.count()]);
  await migrate(); await seedDatabase();
  assert.deepEqual(await Promise.all([User.count(), EscapeRoom.count(), Review.count(), Booking.count()]), counts);
  assert.equal(await (await User.findByPk(user.id)).checkPassword("strong-test-password"), true);
});
test("new administrator passwords are validated before creating an account", async () => {
  const previous = { adminEmail: env.adminEmail, adminPassword: env.adminPassword };
  const email = "new-bootstrap-admin@example.test";
  try {
    Object.assign(env, { adminEmail: email, adminPassword: "short12" });
    await assert.rejects(seedDatabase({ demo: false }), /at least 8 characters/);
    assert.equal(await User.count({ where: { email } }), 0);
    env.adminPassword = "eight123";
    await seedDatabase({ demo: false });
    const admin = await User.findOne({ where: { email } });
    assert.equal(admin.isAdmin, true);
    assert.equal(await admin.checkPassword(env.adminPassword), true);
  } finally {
    Object.assign(env, previous);
    await User.destroy({ where: { email } });
  }
});
test("an existing administrator can start and sign in without resetting the password", async () => {
  const previous = { adminEmail: env.adminEmail, adminPassword: env.adminPassword };
  const email = "existing-bootstrap-admin@example.test";
  try {
    const admin = await User.create({ email, firstName: "Existing", lastName: "Admin", password: "short123", isAdmin: true, hasPassword: true });
    const hash = admin.password;
    Object.assign(env, { adminEmail: email, adminPassword: "short123" });
    assert.doesNotThrow(validateServerEnv);
    await seedDatabase({ demo: false });
    assert.equal((await admin.reload()).password, hash);
    const result = await authMutations.login(null, { email, password: "short123" });
    assert.equal(result.user.isAdmin, true);
    assert.ok(result.token);
    env.adminPassword = "another-bootstrap-password";
    await seedDatabase({ demo: false });
    assert.equal((await admin.reload()).password, hash);
  } finally {
    Object.assign(env, previous);
    await User.destroy({ where: { email } });
  }
});
test("registration normalizes email and never grants admin privileges", async () => {
  await assert.rejects(authMutations.createUser(null, { firstName: "New", lastName: "Visitor", email: "short-password@example.test", password: "short12" }), (error) => error.extensions?.code === "BAD_USER_INPUT");
  assert.equal(await User.count({ where: { email: "short-password@example.test" } }), 0);
  const result = await authMutations.createUser(null, { firstName: "New", lastName: "Visitor", email: "ADMIN@GMAIL.COM", password: "eight123" });
  assert.equal(result.user.email, "admin@gmail.com");
  assert.equal(result.user.isAdmin, false);
  assert.notEqual(result.user.password, "eight123");
  await assert.rejects(authMutations.createUser(null, { firstName: "New", lastName: "Visitor", email: "admin@gmail.com", password: "another-test-password" }), /already in use/);
});
test("concurrent requests cannot double-book the same slot", async () => {
  const input = { escape_room_id: room.id, numberOfPlayers: 2, date: tomorrow(), time: "10:00:00" };
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => createBooking(input, context)));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 4);
  assert.equal(await Booking.count({ where: { escape_room_id: room.id, date: tomorrow(), time: "10:00:00" } }), 1);
});
test("demo payment uses the stored amount, checks ownership and is idempotent", async () => {
  const booking = await createBooking({ escape_room_id: room.id, numberOfPlayers: 2, date: tomorrow(), time: "11:00:00" }, context);
  await assert.rejects(paymentMutations.completeDemoPayment(null, { booking_id: booking.id }, { user: { id: user.id + 999, isAdmin: false } }), /permission/);
  const paid = await paymentMutations.completeDemoPayment(null, { booking_id: booking.id }, context);
  const repeated = await paymentMutations.completeDemoPayment(null, { booking_id: booking.id }, context);
  assert.equal(paid.payment_amount, room.price * 2);
  assert.equal(paid.payment_method, "Demo");
  assert.equal(paid.transaction_id, repeated.transaction_id);
});
test("cancelled slots can be booked again", async () => {
  const input = { escape_room_id: room.id, numberOfPlayers: 2, date: tomorrow(), time: "12:00:00" };
  const first = await createBooking(input, context);
  await first.update({ status: "cancelled", payment_status: "cancelled" });
  const second = await createBooking(input, context);
  assert.notEqual(first.id, second.id);
});
test("expired bookings reconcile after inactivity without a background timer", async () => {
  const yesterday = DateTime.now().setZone("Europe/Kyiv").minus({ days: 1 }).toISODate();
  const paid = await Booking.create({ user_id: user.id, escape_room_id: room.id, numberOfPlayers: 2, date: yesterday, time: "10:00:00", payment_amount: 1000, payment_status: "completed" });
  const pending = await Booking.create({ user_id: user.id, escape_room_id: room.id, numberOfPlayers: 2, date: yesterday, time: "11:00:00", payment_amount: 1000 });
  await expireBookings(true);
  assert.equal((await paid.reload()).status, "completed");
  assert.equal((await pending.reload()).status, "cancelled");
});
test("users can remove completed bookings from history without issuing a refund", async () => {
  const { Mutation } = require("../../schemas/resolvers");
  const booking = await Booking.create({ user_id: user.id, escape_room_id: room.id, numberOfPlayers: 2, date: DateTime.now().minus({ days: 30 }).toISODate(), time: "10:00:00", payment_amount: 1000, payment_status: "completed", status: "completed", payment_method: "PayPal Sandbox", transaction_id: "HISTORY-TEST-CAPTURE" });
  await assert.rejects(Mutation.deleteBooking(null, { booking_id: booking.id }, { user: { id: user.id + 999, isAdmin: false } }), /permission/);
  const external = mock.method(globalThis, "fetch", async () => { throw new Error("History removal must not contact a payment provider."); });
  try {
    assert.equal(await Mutation.deleteBooking(null, { booking_id: booking.id }, context), true);
    assert.equal(await Booking.findByPk(booking.id), null);
    assert.equal(external.mock.callCount(), 0);
  } finally { external.mock.restore(); }
});
test("deleted or blocked users lose access even with an existing JWT", async () => {
  const token = signToken(user);
  const req = { headers: { authorization: `Bearer ${token}` } };
  assert.equal((await authMiddleware({ req })).user.id, user.id);
  await user.update({ isBlocked: true });
  assert.equal((await authMiddleware({ req })).user, null);
  await user.update({ isBlocked: false });
  const missing = signToken({ id: 2147483640, email: "missing@example.test", isAdmin: true });
  assert.equal((await authMiddleware({ req: { headers: { authorization: `Bearer ${missing}` } } })).user, null);
});
test("verification codes are single-use and lock out repeated guesses", async () => {
  const insert = async () => {
    const id = randomUUID();
    const hash = createHmac("sha256", process.env.JWT_SECRET).update(`${id}:123456`).digest("hex");
    await sequelize.query("INSERT INTO auth_challenges (id, email, code_hash, expires_at) VALUES ($1, $2, $3, now() + interval '15 minutes')", { bind: [id, user.email, hash] });
    return id;
  };
  const singleUse = await insert();
  assert.equal(await verifyChallenge(singleUse, user.email, "123456", true), true);
  await assert.rejects(verifyChallenge(singleUse, user.email, "123456", true), /Invalid or expired/);
  const locked = await insert();
  for (let index = 0; index < 8; index += 1) await assert.rejects(verifyChallenge(locked, user.email, "000000"));
  await assert.rejects(verifyChallenge(locked, user.email, "123456"), /Invalid or expired/);
});
async function withTestMail(run) {
  const previous = { mailProvider: env.mailProvider, resendApiKey: env.resendApiKey, emailFrom: env.emailFrom };
  const messages = [];
  const delivery = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    const message = JSON.parse(options.body);
    messages.push({ ...message, code: message.text.match(/\b\d{6}\b/)[0] });
    return Response.json({ id: "test-message" });
  });
  Object.assign(env, { mailProvider: "resend", resendApiKey: "test-only-key", emailFrom: "sender@example.test" });
  try { return await run(messages); }
  finally { delivery.mock.restore(); Object.assign(env, previous); }
}
test("email codes support verification and sign-in without exposing or reusing the code", async () => withTestMail(async (messages) => {
  const challenge = await authMutations.sendAuthCode(null, { email: user.email });
  assert.match(challenge, /^[0-9a-f-]{36}$/);
  assert.notEqual(challenge, messages[0].code);
  await assert.rejects(authMutations.verifyAuthCode(null, { email: user.email, code: "000000", authJwt: challenge }));
  assert.equal(await authMutations.verifyAuthCode(null, { email: user.email, code: messages[0].code, authJwt: challenge }), true);
  await assert.rejects(authMutations.verifyAuthCode(null, { email: user.email, code: messages[0].code, authJwt: challenge }));
  const loginChallenge = await authMutations.sendAuthCode(null, { email: user.email });
  const result = await authMutations.loginWithCode(null, { email: user.email, code: messages[1].code, authJwt: loginChallenge });
  assert.equal(result.user.id, user.id);
  assert.ok(result.token);
  await assert.rejects(authMutations.loginWithCode(null, { email: user.email, code: messages[1].code, authJwt: loginChallenge }));
}));
test("password recovery verifies the emailed code and updates the stored password", async () => withTestMail(async (messages) => {
  const account = await User.create({ firstName: "Reset", lastName: "Visitor", email: "reset-user@example.test", password: "old-test-password", hasPassword: true });
  await authMutations.forgotPassword(null, { email: account.email });
  assert.deepEqual(messages[0].to, [account.email]);
  await assert.rejects(authMutations.verifyResetCode(null, { email: account.email, code: "000000" }));
  assert.equal(await authMutations.verifyResetCode(null, { email: account.email, code: messages[0].code }), true);
  assert.equal(await authMutations.resetPassword(null, { email: account.email, code: messages[0].code, newPassword: "newpass88" }), true);
  await account.reload();
  assert.equal(await account.checkPassword("newpass88"), true);
  assert.equal(await account.checkPassword("old-test-password"), false);
  assert.equal(account.resetPasswordToken, null);
  await assert.rejects(authMutations.resetPassword(null, { email: account.email, code: messages[0].code, newPassword: "another-pass" }));
}));
test("email changes require a code sent to the new email address", async () => withTestMail(async (messages) => {
  const account = await User.create({ firstName: "Email", lastName: "Visitor", email: "email-change@example.test", password: "email-test-password", hasPassword: true });
  const accountContext = { user: { id: account.id, isAdmin: false } };
  await assert.rejects(authMutations.requestEmailUpdate(null, { newEmail: user.email }, accountContext), /already in use/);
  assert.equal(messages.length, 0);
  await authMutations.requestEmailUpdate(null, { newEmail: "changed-email@example.test" }, accountContext);
  assert.deepEqual(messages[0].to, ["changed-email@example.test"]);
  await assert.rejects(authMutations.confirmEmailUpdate(null, { token: "000000" }, accountContext));
  const updated = await authMutations.confirmEmailUpdate(null, { token: messages[0].code }, accountContext);
  assert.equal(updated.email, "changed-email@example.test");
  assert.equal(updated.pendingEmail, null);
  await assert.rejects(authMutations.confirmEmailUpdate(null, { token: messages[0].code }, accountContext));
}));
test("Firebase Google sign-in creates a visitor, follows the UID and rejects blocked or unverified users", async () => {
  const previous = env.firebaseProjectId;
  env.firebaseProjectId = "test-firebase-project";
  const profile = { uid: "google-visitor-uid", email: "GOOGLE-USER@example.test", email_verified: true, name: "Google Visitor", firebase: { sign_in_provider: "google.com" } };
  const verify = async (idToken, projectId) => {
    assert.equal(idToken, "test-id-token");
    assert.equal(projectId, env.firebaseProjectId);
    return profile;
  };
  try {
    assert.ok((await signInWithGoogle("test-id-token", { verify })).token);
    assert.ok((await signInWithGoogle("test-id-token", { verify })).token);
    const account = await User.findOne({ where: { email: "google-user@example.test" } });
    assert.equal(await User.count({ where: { email: account.email } }), 1);
    assert.equal(account.isAdmin, false);
    assert.equal(account.hasPassword, false);
    assert.equal(account.firebaseUid, profile.uid);
    assert.equal(account.firstName, "Google");
    await account.update({ email: "changed-google-user@example.test" });
    assert.ok((await signInWithGoogle("test-id-token", { verify })).token);
    assert.equal(await User.count({ where: { firebaseUid: profile.uid } }), 1);
    assert.equal(await User.count({ where: { email: "google-user@example.test" } }), 0);
    await account.update({ isBlocked: true });
    await assert.rejects(signInWithGoogle("test-id-token", { verify }), /blocked/);
    profile.email_verified = false;
    await assert.rejects(signInWithGoogle("test-id-token", { verify }), /verified Google account/);
  } finally { env.firebaseProjectId = previous; }
});
test("Firebase links an existing account without changing its password or administrator privileges", async () => {
  const previous = env.firebaseProjectId;
  env.firebaseProjectId = "test-firebase-project";
  const account = await User.create({ email: "firebase-admin@example.test", firstName: "Existing", lastName: "Admin", password: "admin-password", hasPassword: true, isAdmin: true });
  const passwordHash = account.password;
  const profile = { uid: "google-admin-uid", email: "FIREBASE-ADMIN@example.test", email_verified: true, name: "Different Name", firebase: { sign_in_provider: "google.com" } };
  const verify = async () => profile;
  try {
    assert.ok((await signInWithGoogle("test-id-token", { verify })).token);
    await account.reload();
    assert.equal(account.firebaseUid, profile.uid);
    assert.equal(account.password, passwordHash);
    assert.equal(account.isAdmin, true);
    assert.equal(account.hasPassword, true);
    assert.equal(account.firstName, "Existing");
    profile.uid = "different-google-uid";
    await assert.rejects(signInWithGoogle("test-id-token", { verify }), /another Google identity/);
    profile.firebase.sign_in_provider = "password";
    await assert.rejects(signInWithGoogle("test-id-token", { verify }), /verified Google account/);
    await assert.rejects(signInWithGoogle(undefined, { verify }), /authentication failed/);
    assert.equal(await User.count({ where: { email: account.email } }), 1);
  } finally { env.firebaseProjectId = previous; }
});
test("GraphQL API supports rooms and auth while denying admin queries", async () => {
  server = await createApp();
  const rooms = await server.apollo.executeOperation({ query: "{ getAllEscapeRooms { id theme gallery averageRating reviews { user { firstName } } } }" }, { contextValue: { user: null } });
  assert.equal(rooms.body.singleResult.errors, undefined);
  assert.equal(rooms.body.singleResult.data.getAllEscapeRooms.length, 4);
  const denied = await server.apollo.executeOperation({ query: "{ getAllUsers { id email } }" }, { contextValue: context });
  assert.equal(denied.body.singleResult.errors[0].extensions.code, "FORBIDDEN");
  const login = await server.apollo.executeOperation({ query: "mutation { login(email: \"visitor@example.test\", password: \"strong-test-password\") { token user { id } } }" });
  assert.ok(login.body.singleResult.data.login.token);
});
