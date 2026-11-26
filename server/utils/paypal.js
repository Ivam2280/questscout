const { randomUUID } = require("node:crypto");
const { GraphQLError } = require("graphql");
const { env } = require("../config/env");

const HOST = "https://api-m.sandbox.paypal.com";
const MESSAGES = {
  INVALID_CLIENT: "PayPal rejected the sandbox application credentials. Check its client ID and secret.",
  INSTRUMENT_DECLINED:
    "PayPal declined this funding source. Please choose another payment method in PayPal.",
  ORDER_NOT_APPROVED: "Please approve the payment in PayPal before confirming it.",
  PAYER_ACTION_REQUIRED:
    "PayPal needs you to complete an additional verification. Please return to PayPal.",
  PAYEE_ACCOUNT_RESTRICTED:
    "The seller’s PayPal Sandbox account cannot receive this payment. Check the business sandbox account settings.",
  PAYEE_ACCOUNT_INVALID:
    "The seller’s PayPal Sandbox account is unavailable. Check the configured sandbox application.",
  PAYEE_BLOCKED_TRANSACTION:
    "The seller’s PayPal Sandbox account blocked this payment. Check its payment receiving preferences.",
  PAYER_ACCOUNT_RESTRICTED:
    "This PayPal Sandbox buyer account is restricted. Please use another personal sandbox account.",
  PAYER_CANNOT_PAY:
    "This PayPal Sandbox buyer cannot pay for this order. Please use another personal sandbox account.",
  PAYMENT_PENDING:
    "PayPal is still processing this payment. Check your booking before trying again.",
};

function paypalError(issue, debugId) {
  return new GraphQLError(
    MESSAGES[issue] || "PayPal could not complete the payment. Please try again.",
    {
      extensions: {
        code: "PAYPAL_ERROR",
        paypalIssue: issue,
        ...(debugId ? { paypalDebugId: debugId } : {}),
      },
    },
  );
}

function capturedOrder(order, bookingId) {
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (capture?.status === "PENDING") throw paypalError("PAYMENT_PENDING");
  if (
    order.status !== "COMPLETED" ||
    order.purchase_units?.length !== 1 ||
    capture?.status !== "COMPLETED" ||
    !capture.id ||
    unit.custom_id !== String(bookingId)
  ) {
    throw paypalError("PAYMENT_NOT_COMPLETED");
  }
  return { id: capture.id, amount: capture.amount?.value, currency: capture.amount?.currency_code };
}

function createPayPalClient(config, dependencies = {}) {
  const fetchRequest = dependencies.fetch || ((...args) => fetch(...args));
  const logError = dependencies.logError || console.error;

  async function readResponse(response, operation) {
    const data = (await response.json().catch(() => ({}))) || {};
    if (response.ok) return data;
    const suppliedIssue = (data.details?.[0]?.issue || data.name || data.error)?.toUpperCase?.();
    const issue =
      typeof suppliedIssue === "string" && /^[A-Z_]{3,80}$/.test(suppliedIssue)
        ? suppliedIssue
        : "PAYPAL_UNAVAILABLE";
    const suppliedDebugId = data.debug_id || response.headers?.get("paypal-debug-id");
    const debugId =
      typeof suppliedDebugId === "string" && /^[a-f0-9]{8,32}$/i.test(suppliedDebugId)
        ? suppliedDebugId
        : undefined;
    logError(
      `[paypal:${operation}] HTTP ${response.status}; ${issue}${debugId ? `; debug_id=${debugId}` : ""}`,
    );
    throw paypalError(issue, debugId);
  }

  async function send(url, options, operation) {
    try {
      return await readResponse(
        await fetchRequest(url, { ...options, signal: AbortSignal.timeout(15000) }),
        operation,
      );
    } catch (error) {
      if (error.extensions?.code === "PAYPAL_ERROR") throw error;
      logError(`[paypal:${operation}] Connection failed or timed out.`);
      throw paypalError("PAYPAL_UNAVAILABLE");
    }
  }

  async function getAccessToken() {
    if (!config.paypalClientId || !config.paypalClientSecret)
      throw paypalError("PAYPAL_NOT_CONFIGURED");
    const authorization = Buffer.from(
      `${config.paypalClientId}:${config.paypalClientSecret}`,
    ).toString("base64");
    const data = await send(
      `${HOST}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
      "oauth",
    );
    if (!data.access_token) throw paypalError("PAYPAL_UNAVAILABLE");
    return data.access_token;
  }

  async function request(path, { body, requestId, method = "POST" } = {}) {
    const token = await getAccessToken();
    return send(
      `${HOST}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
        },
        ...(method !== "GET" ? { body: JSON.stringify(body || {}) } : {}),
      },
      method === "GET"
        ? "get-order"
        : path.endsWith("/capture")
          ? "capture"
          : path.endsWith("/refund")
            ? "refund"
            : "create-order",
    );
  }

  function orderPath(orderId) {
    if (!/^[A-Z0-9]{1,64}$/i.test(orderId)) throw paypalError("INVALID_RESOURCE_ID");
    return `/v2/checkout/orders/${orderId}`;
  }

  const getOrder = async (orderId) => {
    const order = await request(orderPath(orderId), { method: "GET" });
    if (!["CREATED", "SAVED", "APPROVED", "VOIDED", "COMPLETED", "PAYER_ACTION_REQUIRED"].includes(order.status)) {
      throw paypalError("PAYPAL_UNAVAILABLE");
    }
    return order;
  };

  async function createOrder(amountUSD, bookingId) {
    const data = await request("/v2/checkout/orders", {
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: String(bookingId),
            description: "QuestScout escape room booking",
            amount: { currency_code: "USD", value: amountUSD },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "QuestScout",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
            },
          },
        },
      },
      requestId: `questscout-order-${randomUUID()}`,
    });
    if (!data.id) throw paypalError("PAYPAL_UNAVAILABLE");
    return data.id;
  }

  async function capturePayment(orderId, bookingId) {
    let data;
    try {
      data = await request(`${orderPath(orderId)}/capture`, {
        requestId: `questscout-capture-${orderId}`,
      });
    } catch (error) {
      if (error.extensions?.paypalIssue !== "ORDER_ALREADY_CAPTURED") throw error;
      data = await getOrder(orderId);
    }
    if (data.status === "COMPLETED" && !data.purchase_units) data = await getOrder(orderId);
    return capturedOrder(data, bookingId);
  }

  async function refundPayment(captureId) {
    if (!/^[A-Z0-9]{1,64}$/i.test(captureId)) throw paypalError("INVALID_RESOURCE_ID");
    return request(`/v2/payments/captures/${captureId}/refund`, {
      requestId: `questscout-refund-${captureId}`,
    });
  }

  return { createOrder, getOrder, capturePayment, refundPayment };
}

module.exports = { ...createPayPalClient(env), createPayPalClient, capturedOrder };
