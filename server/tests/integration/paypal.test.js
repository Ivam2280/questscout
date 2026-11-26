const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
) {
  throw new Error("Set TEST_DATABASE_URL to a dedicated database ending in _test.");
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DIRECT_DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = "paypal-test-only-secret-at-least-thirty-two-characters";
process.env.PAYPAL_CLIENT_ID = "test-client";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";
process.env.ADMIN_EMAIL = "";
process.env.ADMIN_PASSWORD = "";
const sequelize = require("../../config/connection");
const { migrate } = require("../../db/migrate");
const { seedDatabase } = require("../../seeds/seed");
const { User, EscapeRoom, Booking } = require("../../models");
const { paymentMutations } = require("../../services/payments");
const { DateTime } = require("luxon");
let user,
  room,
  context,
  sequence = 0;
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });

before(async () => {
  await migrate();
  await seedDatabase();
  room = await EscapeRoom.findOne({ where: { duration: 60 } });
  user = await User.create({
    firstName: "PayPal",
    lastName: "Test",
    email: `paypal-${randomUUID()}@example.test`,
    password: "test-payment-password",
    hasPassword: true,
  });
  context = { user: { id: user.id, isAdmin: false } };
});
after(async () => {
  if (user) {
    await Booking.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }
  await sequelize.close();
});

function booking(values = {}) {
  sequence += 1;
  return Booking.create({
    user_id: user.id,
    escape_room_id: room.id,
    numberOfPlayers: 2,
    date: DateTime.now().setZone("Europe/Kyiv").plus({ days: 30 }).toISODate(),
    time: `10:${String(sequence).padStart(2, "0")}:00`,
    payment_amount: 900,
    payment_status: "pending",
    status: "active",
    ...values,
  });
}
function provider(t, handler) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(new URL(url).hostname, "api-m.sandbox.paypal.com");
    if (url.endsWith("/oauth2/token")) return reply({ access_token: "test-access-token" });
    const request = {
      url,
      ...options,
      payload: options.body ? JSON.parse(options.body) : undefined,
    };
    calls.push(request);
    return handler(request);
  });
  return calls;
}
function completed(id, amount = "21.95", currency = "USD") {
  return {
    status: "COMPLETED",
    purchase_units: [
      {
        custom_id: String(id),
        payments: {
          captures: [
            {
              id: `TESTCAPTURE${id}`,
              status: "COMPLETED",
              amount: { currency_code: currency, value: amount },
            },
          ],
        },
      },
    ],
  };
}

test("PayPal creates a server-priced order bound to the owned booking", async (t) => {
  const record = await booking();
  const calls = provider(t, () => reply({ id: "NEWORDER" }, 201));
  assert.equal(
    await paymentMutations.createPayPalOrder(null, { booking_id: record.id }, context),
    "NEWORDER",
  );
  await record.reload();
  assert.equal(record.paypal_order_id, "NEWORDER");
  assert.equal(Number(record.paypal_amount), 21.95);
  assert.equal(calls[0].payload.purchase_units[0].custom_id, String(record.id));
  assert.equal(
    calls[0].payload.payment_source.paypal.experience_context.shipping_preference,
    "NO_SHIPPING",
  );
  assert.equal(record.payment_status, "pending");
});

test("PayPal renews an unapproved or expired order instead of returning it forever", async (t) => {
  for (const expired of [false, true]) {
    const freshId = expired ? "FRESHORDER2" : "FRESHORDER1";
    const record = await booking({ paypal_order_id: "OLDORDER", paypal_amount: 21.95 });
    const calls = provider(t, (request) =>
      request.method === "GET"
        ? expired
          ? reply({ details: [{ issue: "INVALID_RESOURCE_ID" }] }, 404)
          : reply({ status: "CREATED" })
        : reply({ id: freshId }, 201),
    );
    assert.equal(
      await paymentMutations.createPayPalOrder(null, { booking_id: record.id }, context),
      freshId,
    );
    assert.equal((await record.reload()).paypal_order_id, freshId);
    assert.deepEqual(
      calls.map((request) => request.method),
      ["GET", "POST"],
    );
    t.mock.restoreAll();
  }
});

test("PayPal never replaces an approved order or creates a second order after a network failure", async (t) => {
  const record = await booking({ paypal_order_id: "APPROVEDORDER", paypal_amount: 21.95 });
  const calls = provider(t, () => reply({ status: "APPROVED" }));
  assert.equal(
    await paymentMutations.createPayPalOrder(null, { booking_id: record.id }, context),
    "APPROVEDORDER",
  );
  assert.equal(calls.length, 1);
  t.mock.restoreAll();
  const failed = provider(t, () => reply({ name: "INTERNAL_SERVER_ERROR" }, 500));
  await assert.rejects(
    paymentMutations.createPayPalOrder(null, { booking_id: record.id }, context),
  );
  assert.equal(failed.length, 1);
  assert.equal((await record.reload()).paypal_order_id, "APPROVEDORDER");
});

test("PayPal confirms exactly once and rejects a different user's booking without contacting PayPal", async (t) => {
  const record = await booking({ paypal_order_id: "OWNEDORDER", paypal_amount: 21.95 });
  const calls = provider(t, () => reply(completed(record.id), 201));
  await assert.rejects(
    paymentMutations.capturePayPalOrder(
      null,
      { orderId: "OWNEDORDER", booking_id: record.id },
      { user: { id: user.id + 9999 } },
    ),
    /permission/,
  );
  assert.equal(calls.length, 0);
  await assert.rejects(
    paymentMutations.capturePayPalOrder(
      null,
      { orderId: "OTHERORDER", booking_id: record.id },
      context,
    ),
    /does not belong/,
  );
  const result = await paymentMutations.capturePayPalOrder(
    null,
    { orderId: "OWNEDORDER", booking_id: record.id },
    context,
  );
  const repeated = await paymentMutations.capturePayPalOrder(
    null,
    { orderId: "OWNEDORDER", booking_id: record.id },
    context,
  );
  assert.equal(result.payment_status, "completed");
  assert.equal(result.payment_method, "PayPal Sandbox");
  assert.equal(repeated.transaction_id, `TESTCAPTURE${record.id}`);
  assert.equal(calls.length, 1);
});

test("PayPal funding failures and incorrect amounts cannot mark the booking paid", async (t) => {
  const record = await booking({ paypal_order_id: "DECLINEDORDER", paypal_amount: 21.95 });
  provider(t, () => reply({ details: [{ issue: "INSTRUMENT_DECLINED" }] }, 422));
  await assert.rejects(
    paymentMutations.capturePayPalOrder(
      null,
      { orderId: "DECLINEDORDER", booking_id: record.id },
      context,
    ),
    (error) => error.extensions?.paypalIssue === "INSTRUMENT_DECLINED",
  );
  assert.equal((await record.reload()).payment_status, "pending");
  t.mock.restoreAll();
  for (const [amount, currency] of [
    ["0.01", "USD"],
    ["21.95", "EUR"],
  ]) {
    provider(t, () => reply(completed(record.id, amount, currency)));
    await assert.rejects(
      paymentMutations.capturePayPalOrder(
        null,
        { orderId: "DECLINEDORDER", booking_id: record.id },
        context,
      ),
      /does not match/,
    );
    assert.equal((await record.reload()).payment_status, "pending");
    t.mock.restoreAll();
  }
});

test("PayPal reconciles an already captured order before returning an already-paid response", async (t) => {
  const record = await booking({ paypal_order_id: "CAPTUREDORDER", paypal_amount: 21.95 });
  const calls = provider(t, () => reply(completed(record.id)));
  await assert.rejects(
    paymentMutations.createPayPalOrder(null, { booking_id: record.id }, context),
    (error) => error.extensions?.code === "PAYPAL_ALREADY_COMPLETED",
  );
  await record.reload();
  assert.equal(record.payment_status, "completed");
  assert.equal(record.transaction_id, `TESTCAPTURE${record.id}`);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
});
