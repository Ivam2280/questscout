const test = require("node:test");
const assert = require("node:assert/strict");
const { createPayPalClient } = require("../utils/paypal");

const credentials = { paypalClientId: "test-client", paypalClientSecret: "test-secret" };
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
function harness(handler) {
  const calls = [],
    logs = [];
  const client = createPayPalClient(credentials, {
    fetch: async (url, options) => {
      assert.equal(new URL(url).hostname, "api-m.sandbox.paypal.com");
      if (url.endsWith("/oauth2/token")) return reply({ access_token: "test-access-token" });
      calls.push({ url, ...options, payload: options.body ? JSON.parse(options.body) : undefined });
      return handler(calls.at(-1));
    },
    logError: (message) => logs.push(message),
  });
  return { client, calls, logs };
}
const completed = (customId = "11") => ({
  id: "TESTORDER",
  status: "COMPLETED",
  purchase_units: [
    {
      custom_id: customId,
      payments: {
        captures: [
          {
            id: "TESTCAPTURE",
            status: "COMPLETED",
            amount: { value: "21.95", currency_code: "USD" },
          },
        ],
      },
    },
  ],
});

test("PayPal service checkout skips shipping, uses Pay Now and gives each fresh attempt its own request ID", async () => {
  const { client, calls } = harness(() => reply({ id: "TESTORDER" }, 201));
  await client.createOrder("21.95", 11);
  await client.createOrder("21.95", 11);
  assert.deepEqual(calls[0].payload.payment_source.paypal.experience_context, {
    brand_name: "QuestScout",
    shipping_preference: "NO_SHIPPING",
    user_action: "PAY_NOW",
  });
  assert.equal(calls[0].payload.purchase_units[0].custom_id, "11");
  assert.deepEqual(calls[0].payload.purchase_units[0].amount, {
    currency_code: "USD",
    value: "21.95",
  });
  assert.notEqual(calls[0].headers["PayPal-Request-Id"], calls[1].headers["PayPal-Request-Id"]);
});

test("PayPal capture requests full details and uses the same idempotency key when retried", async () => {
  const { client, calls } = harness(() => reply(completed(), 201));
  const result = await client.capturePayment("TESTORDER", 11);
  await client.capturePayment("TESTORDER", 11);
  assert.deepEqual(result, { id: "TESTCAPTURE", amount: "21.95", currency: "USD" });
  assert.equal(calls[0].headers.Prefer, "return=representation");
  assert.equal(calls[0].headers["PayPal-Request-Id"], calls[1].headers["PayPal-Request-Id"]);
});

test("PayPal capture recovers a completed payment after an interrupted response without charging again", async () => {
  const { client, calls } = harness((request) =>
    request.method === "GET"
      ? reply(completed())
      : reply({ details: [{ issue: "ORDER_ALREADY_CAPTURED" }] }, 422),
  );
  assert.equal((await client.capturePayment("TESTORDER", 11)).id, "TESTCAPTURE");
  assert.deepEqual(
    calls.map((request) => request.method),
    ["POST", "GET"],
  );
  assert.equal(calls[1].payload, undefined);
});

test("PayPal capture rejects another booking and pending payments", async () => {
  const wrong = harness(() => reply(completed("999")));
  await assert.rejects(
    wrong.client.capturePayment("TESTORDER", 11),
    (error) => error.extensions?.paypalIssue === "PAYMENT_NOT_COMPLETED",
  );
  const data = completed();
  data.purchase_units[0].payments.captures[0].status = "PENDING";
  const pending = harness(() => reply(data));
  await assert.rejects(
    pending.client.capturePayment("TESTORDER", 11),
    (error) => error.extensions?.paypalIssue === "PAYMENT_PENDING",
  );
});

test("PayPal errors expose actionable issue codes and safe diagnostics, never provider payloads or credentials", async () => {
  const { client, logs } = harness(() =>
    reply(
      {
        name: "UNPROCESSABLE_ENTITY",
        debug_id: "abcdef0123456",
        message: "test-secret buyer@example.test test-access-token",
        details: [{ issue: "INSTRUMENT_DECLINED", description: "private payment information" }],
      },
      422,
    ),
  );
  let failure;
  await assert.rejects(client.capturePayment("TESTORDER", 11), (error) => {
    failure = error;
    return (
      error.extensions?.paypalIssue === "INSTRUMENT_DECLINED" &&
      error.extensions.paypalDebugId === "abcdef0123456"
    );
  });
  assert.match(failure.message, /another payment method/);
  assert.match(logs[0], /422.*INSTRUMENT_DECLINED.*abcdef0123456/);
  for (const secret of [
    "test-secret",
    "buyer@example.test",
    "test-access-token",
    "private payment information",
  ]) {
    assert.equal(JSON.stringify({ logs, failure }).includes(secret), false);
  }
});

test("PayPal network failures and invalid order IDs cannot leak secrets or reach an unexpected endpoint", async () => {
  const logs = [];
  const client = createPayPalClient(credentials, {
    fetch: async () => {
      throw new Error("test-secret");
    },
    logError: (message) => logs.push(message),
  });
  await assert.rejects(
    client.getOrder("../other"),
    (error) => error.extensions?.paypalIssue === "INVALID_RESOURCE_ID",
  );
  assert.equal(logs.length, 0);
  await assert.rejects(
    client.createOrder("21.95", 11),
    (error) =>
      !error.message.includes("test-secret") &&
      error.extensions?.paypalIssue === "PAYPAL_UNAVAILABLE",
  );
  assert.equal(
    logs.some((message) => message.includes("test-secret")),
    false,
  );
});
