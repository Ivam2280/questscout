const { test, expect } = require("@playwright/test");
const { randomUUID } = require("node:crypto");

async function graphql(request, query, variables = {}, token) {
  const response = await request.post("/graphql", {
    data: { query, variables },
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  const result = await response.json();
  expect(result.errors).toBeUndefined();
  return result.data;
}

async function checkout(page, request, onPayment) {
  const {
    createUser: { token },
  } = await graphql(
    request,
    'mutation($email: String!) { createUser(firstName: "PayPal", lastName: "Browser", email: $email, password: "browser-test-password") { token } }',
    { email: `paypal-${randomUUID()}@example.test` },
  );
  const { getAllEscapeRooms: rooms } = await graphql(request, "{ getAllEscapeRooms { id } }");
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const { availableSlots: slots } = await graphql(
    request,
    "query($id:Int!,$date:String!) { availableSlots(escape_room_id:$id,start_date:$date,end_date:$date) { date time } }",
    { id: rooms[0].id, date },
  );
  const { createBooking: booking } = await graphql(
    request,
    "mutation($id:Int!,$date:String!,$time:String!) { createBooking(escape_room_id:$id,numberOfPlayers:2,date:$date,time:$time) { id payment_status payment_amount payment_method transaction_id } }",
    { id: rooms[0].id, date: slots[0].date, time: slots[0].time },
    token,
  );
  await page.addInitScript((value) => localStorage.setItem("id_token", value), token);
  await page.route("**/api/config", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      json: { ...(await response.json()), paypalClientId: "test-client", demoPayments: false },
    });
  });
  await page.route("**/graphql", async (route) => {
    const operation = route.request().postDataJSON()?.operationName;
    if (["createPayPalOrder", "capturePayPalOrder"].includes(operation))
      return onPayment(route, operation, booking);
    return route.continue();
  });
  await page.route("https://www.paypal.com/sdk/js?**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
    window.paypal = { Buttons(options) {
      let button;
      return { isEligible: () => true, close: () => button?.remove(), render(container) {
        button = document.createElement('button'); button.textContent = 'Test PayPal checkout';
        button.onclick = async () => {
          try {
            const orderID = await options.createOrder();
            await options.onApprove({orderID}, {restart: () => { window.paypalRestarts = (window.paypalRestarts || 0) + 1; return Promise.resolve(); }});
          } catch(error) { options.onError(error); }
        };
        container.appendChild(button); return Promise.resolve();
      }};
    }};
  `,
    }),
  );
  await page.goto("/mybookings");
  await page.getByRole("button", { name: "Pay Now", exact: true }).click();
  await page.getByRole("button", { name: "Test PayPal checkout", exact: true }).click();
}

test("PayPal checkout shows success only after the server confirms a completed payment", async ({
  page,
  request,
}) => {
  await checkout(page, request, (route, operation, booking) =>
    route.fulfill({
      json: {
        data:
          operation === "createPayPalOrder"
            ? { createPayPalOrder: "TESTORDER" }
            : {
                capturePayPalOrder: {
                  ...booking,
                  payment_status: "completed",
                  payment_method: "PayPal Sandbox",
                  transaction_id: "TESTCAPTURE",
                },
              },
      },
    }),
  );
  await expect(page.getByRole("heading", { name: "Payment Complete", exact: true })).toBeVisible();
});

test("PayPal checkout restarts funding selection after a declined instrument", async ({
  page,
  request,
}) => {
  await checkout(page, request, (route, operation) =>
    route.fulfill({
      json:
        operation === "createPayPalOrder"
          ? { data: { createPayPalOrder: "TESTORDER" } }
          : {
              errors: [
                {
                  message: "Please choose another payment method.",
                  extensions: { code: "PAYPAL_ERROR", paypalIssue: "INSTRUMENT_DECLINED" },
                },
              ],
            },
    }),
  );
  await expect.poll(() => page.evaluate(() => window.paypalRestarts)).toBe(1);
  await expect(page.getByRole("heading", { name: "Payment Complete", exact: true })).toHaveCount(0);
  await expect(page.getByText("Processing secure payment…")).toHaveCount(0);
});

test("PayPal checkout preserves the provider's useful error when the SDK also reports a failure", async ({
  page,
  request,
}) => {
  let captured = false;
  await checkout(page, request, (route, operation) => {
    if (operation === "capturePayPalOrder") captured = true;
    return route.fulfill({
      json: {
        errors: [
          {
            message: "The seller’s PayPal Sandbox account cannot receive this payment.",
            extensions: { code: "PAYPAL_ERROR", paypalIssue: "PAYEE_ACCOUNT_RESTRICTED" },
          },
        ],
      },
    });
  });
  await expect(
    page.getByText("The seller’s PayPal Sandbox account cannot receive this payment.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment Complete", exact: true })).toHaveCount(0);
  expect(captured).toBe(false);
});

test("PayPal checkout rejects a non-completed capture response", async ({ page, request }) => {
  await checkout(page, request, (route, operation, booking) =>
    route.fulfill({
      json: {
        data:
          operation === "createPayPalOrder"
            ? { createPayPalOrder: "TESTORDER" }
            : { capturePayPalOrder: { ...booking, payment_status: "pending" } },
      },
    }),
  );
  await expect(
    page.getByText(
      "The sandbox payment could not be confirmed. Please check the booking before retrying.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment Complete", exact: true })).toHaveCount(0);
});

test("PayPal checkout recognises a payment reconciled by the server without opening another order", async ({
  page,
  request,
}) => {
  let captured = false;
  await checkout(page, request, (route, operation) => {
    if (operation === "capturePayPalOrder") captured = true;
    return route.fulfill({
      json: {
        errors: [
          {
            message: "This booking is already paid.",
            extensions: { code: "PAYPAL_ALREADY_COMPLETED" },
          },
        ],
      },
    });
  });
  await expect(page.getByRole("heading", { name: "Payment Complete", exact: true })).toBeVisible();
  expect(captured).toBe(false);
});
