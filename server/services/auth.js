const { randomUUID, randomInt, createHmac, timingSafeEqual } = require("node:crypto");
const { QueryTypes, UniqueConstraintError } = require("sequelize");
const sequelize = require("../config/connection");
const { env } = require("../config/env");
const { User } = require("../models");
const { signToken } = require("../utils/auth");
const sendEmail = require("../utils/sendEmail");
const { requireUser } = require("./bookings");
const { AuthenticationError, ForbiddenError, UserInputError } = require("../utils/errors");

const normalizeEmail = (email) => email.trim().toLowerCase();
const codeHash = (id, code) => createHmac("sha256", env.jwtSecret).update(`${id}:${code}`).digest("hex");
const isDemoUser = (user) => Boolean(user && env.demoUserEmail && normalizeEmail(user.email) === normalizeEmail(env.demoUserEmail));

function requireMutableProfile(user) {
  if (isDemoUser(user)) throw new ForbiddenError("The shared demo profile cannot be changed.");
}

async function issueChallenge(email, subject) {
  if (!sendEmail.emailEnabled()) await sendEmail(email, subject, "");
  const id = randomUUID();
  const code = String(randomInt(100000, 1000000));
  await sequelize.query("DELETE FROM auth_challenges WHERE expires_at < now()", { type: QueryTypes.DELETE });
  await sequelize.query(`INSERT INTO auth_challenges (id, email, code_hash, expires_at)
    VALUES ($1, $2, $3, now() + interval '15 minutes')`, { bind: [id, email, codeHash(id, code)] });
  await sendEmail(email, subject, `Your QuestScout verification code is ${code}. It expires in 15 minutes.`);
  return id;
}

async function verifyChallenge(id, email, code, consume = false) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "") || !/^\d{6}$/.test(code || "")) throw new UserInputError("Invalid or expired verification code.");
  const valid = await sequelize.transaction(async (transaction) => {
    const [row] = await sequelize.query("SELECT * FROM auth_challenges WHERE id = $1 FOR UPDATE", { bind: [id], type: QueryTypes.SELECT, transaction });
    if (!row || row.email !== email || row.consumed_at || row.attempts >= 8 || new Date(row.expires_at) <= new Date()) return false;
    const matches = timingSafeEqual(Buffer.from(row.code_hash, "hex"), Buffer.from(codeHash(id, code), "hex"));
    await sequelize.query("UPDATE auth_challenges SET attempts = attempts + 1, consumed_at = CASE WHEN $2 THEN now() ELSE consumed_at END WHERE id = $1", { bind: [id, matches && consume], transaction });
    return matches;
  });
  if (!valid) throw new UserInputError("Invalid or expired verification code.");
  return true;
}

const authMutations = {
  createUser: async (_, { firstName, lastName, email, password }) => {
    if (!firstName.trim() || !lastName.trim() || firstName.trim().length > 50 || lastName.trim().length > 50) throw new UserInputError("Enter a first and last name of up to 50 characters.");
    try {
      const user = await User.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: normalizeEmail(email), password, isAdmin: false, hasPassword: true });
      return { token: signToken(user), user };
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new UserInputError("Email is already in use.");
      if (error.name === "SequelizeValidationError") throw new UserInputError(error.errors[0].message);
      throw error;
    }
  },
  login: async (_, { email, password }) => {
    const user = await User.findOne({ where: { email: normalizeEmail(email) } });
    if (!user || !user.hasPassword || !(await user.checkPassword(password))) throw new AuthenticationError("Incorrect email or password.");
    if (user.isBlocked) throw new AuthenticationError("Your account has been blocked by the administrator.");
    return { token: signToken(user), user };
  },
  sendAuthCode: async (_, { email }) => issueChallenge(normalizeEmail(email), "QuestScout sign-in code"),
  verifyAuthCode: async (_, { email, code, authJwt }) => verifyChallenge(authJwt, normalizeEmail(email), code, true),
  loginWithCode: async (_, { email, code, authJwt }) => {
    await verifyChallenge(authJwt, normalizeEmail(email), code, true);
    const user = await User.findOne({ where: { email: normalizeEmail(email) } });
    if (!user || user.isBlocked) throw new AuthenticationError("This account is unavailable.");
    return { token: signToken(user), user };
  },
  updateName: async (_, { input }, context) => {
    requireUser(context);
    if (!input.firstName.trim() || !input.lastName.trim() || input.firstName.length > 50 || input.lastName.length > 50) throw new UserInputError("Enter a first and last name of up to 50 characters.");
    const user = await User.findByPk(context.user.id);
    requireMutableProfile(user);
    return user.update({ firstName: input.firstName.trim(), lastName: input.lastName.trim() });
  },
  updatePassword: async (_, { currentPassword, newPassword }, context) => {
    requireUser(context);
    const user = await User.findByPk(context.user.id);
    requireMutableProfile(user);
    if (!user.hasPassword || !(await user.checkPassword(currentPassword))) throw new AuthenticationError("Incorrect current password.");
    if (await user.checkPassword(newPassword)) throw new UserInputError("Choose a different password.");
    return user.update({ password: newPassword });
  },
  addPassword: async (_, { newPassword }, context) => {
    requireUser(context);
    const user = await User.findByPk(context.user.id);
    requireMutableProfile(user);
    if (user.hasPassword) throw new UserInputError("Use the change-password form to update your password.");
    return user.update({ password: newPassword, hasPassword: true });
  },
  requestEmailUpdate: async (_, { newEmail }, context) => {
    requireUser(context);
    const user = await User.findByPk(context.user.id);
    requireMutableProfile(user);
    const email = normalizeEmail(newEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserInputError("Enter a valid email address.");
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new UserInputError("Email is already in use.");
    const id = await issueChallenge(email, "Verify your new QuestScout email");
    await user.update({ pendingEmail: email, verificationToken: id, tokenExpiration: new Date(Date.now() + 900000) });
    return true;
  },
  confirmEmailUpdate: async (_, { token }, context) => {
    requireUser(context);
    const user = await User.findByPk(context.user.id);
    requireMutableProfile(user);
    await verifyChallenge(user.verificationToken, user.pendingEmail, token, true);
    return user.update({ email: user.pendingEmail, pendingEmail: null, verificationToken: null, tokenExpiration: null });
  },
  forgotPassword: async (_, { email }) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (isDemoUser(user)) throw new ForbiddenError("The shared demo password cannot be reset.");
    if (!sendEmail.emailEnabled()) await sendEmail(normalizedEmail, "", "");
    if (user) {
      const id = await issueChallenge(user.email, "Reset your QuestScout password");
      await user.update({ resetPasswordToken: id, resetPasswordExpiration: new Date(Date.now() + 900000) });
    }
    return true;
  },
  verifyResetCode: async (_, { email, code }) => {
    const user = await User.findOne({ where: { email: normalizeEmail(email) } });
    if (!user) throw new UserInputError("Invalid or expired verification code.");
    return verifyChallenge(user.resetPasswordToken, user.email, code);
  },
  resetPassword: async (_, { email, code, newPassword }) => {
    const user = await User.findOne({ where: { email: normalizeEmail(email) } });
    if (!user) throw new UserInputError("Invalid or expired verification code.");
    requireMutableProfile(user);
    await verifyChallenge(user.resetPasswordToken, user.email, code, true);
    await user.update({ password: newPassword, hasPassword: true, resetPasswordToken: null, resetPasswordExpiration: null });
    return true;
  },
};

module.exports = { authMutations, normalizeEmail, verifyChallenge, isDemoUser };
