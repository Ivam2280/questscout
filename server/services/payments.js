const { randomUUID } = require("node:crypto");
const { GraphQLError } = require("graphql");
const sequelize = require("../config/connection");
const { env } = require("../config/env");
const { ownedBooking } = require("./bookings");
const { UserInputError, ForbiddenError } = require("../utils/errors");
const { createOrder, getOrder, capturedOrder, capturePayment } = require("../utils/paypal");

async function saveCapture(booking, capture, transaction) {
  if (
    capture.currency !== "USD" ||
    !Number.isFinite(Number(capture.amount)) ||
    Math.round(Number(capture.amount) * 100) !== Math.round(Number(booking.paypal_amount) * 100)
  ) {
    throw new UserInputError("The PayPal payment amount does not match the booking.");
  }
  return booking.update(
    { payment_status: "completed", payment_method: "PayPal Sandbox", transaction_id: capture.id },
    { transaction },
  );
}

const paymentMutations = {
  completeDemoPayment: async (_, { booking_id }, context) => {
    if (!env.demoPayments) throw new ForbiddenError("Demo payments are disabled.");
    return sequelize.transaction(async (transaction) => {
      const booking = await ownedBooking(booking_id, context, transaction, { payable: true });
      if (booking.payment_status === "completed") return booking;
      return booking.update(
        {
          payment_status: "completed",
          payment_method: "Demo",
          transaction_id: `demo-${randomUUID()}`,
        },
        { transaction },
      );
    });
  },
  createPayPalOrder: async (_, { booking_id }, context) => {
    if (!env.paypalClientId || !env.paypalClientSecret)
      throw new UserInputError("PayPal Sandbox is temporarily unavailable.");
    const result = await sequelize.transaction(async (transaction) => {
      const booking = await ownedBooking(booking_id, context, transaction, { payable: true });
      if (booking.payment_status === "completed") return { alreadyPaid: true };
      if (booking.paypal_order_id) {
        let previous;
        try {
          previous = await getOrder(booking.paypal_order_id);
        } catch (error) {
          if (error.extensions?.paypalIssue !== "INVALID_RESOURCE_ID") throw error;
        }
        if (previous?.status === "COMPLETED") {
          await saveCapture(booking, capturedOrder(previous, booking.id), transaction);
          return { alreadyPaid: true };
        }
        if (previous?.status === "APPROVED") return { id: booking.paypal_order_id };
      }
      const amount = (booking.payment_amount / env.paypalRate).toFixed(2);
      const id = await createOrder(amount, booking.id);
      await booking.update({ paypal_order_id: id, paypal_amount: amount }, { transaction });
      return { id };
    });
    if (result.alreadyPaid) {
      throw new GraphQLError("This booking is already paid.", {
        extensions: { code: "PAYPAL_ALREADY_COMPLETED" },
      });
    }
    return result.id;
  },
  capturePayPalOrder: async (_, { orderId, booking_id }, context) => {
    if (!env.paypalClientId || !env.paypalClientSecret)
      throw new UserInputError("PayPal Sandbox is temporarily unavailable.");
    return sequelize.transaction(async (transaction) => {
      const booking = await ownedBooking(booking_id, context, transaction, { payable: true });
      if (!booking.paypal_order_id || booking.paypal_order_id !== orderId)
        throw new UserInputError("This PayPal order does not belong to the booking.");
      if (booking.payment_status === "completed") return booking;
      return saveCapture(booking, await capturePayment(orderId, booking.id), transaction);
    });
  },
};

module.exports = { paymentMutations };
