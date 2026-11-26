const { Op, UniqueConstraintError } = require("sequelize");
const { DateTime } = require("luxon");
const sequelize = require("../config/connection");
const { Booking, EscapeRoom } = require("../models");
const { env } = require("../config/env");
const { dailySlots, localDate, validateRange, validateBookingSlot } = require("./schedule");
const { UserInputError, AuthenticationError, ForbiddenError } = require("../utils/errors");

let lastExpiration = 0;
let expirationTask;

async function expireBookings(force = false) {
  if (expirationTask) return expirationTask;
  if (!force && Date.now() - lastExpiration < 30000) return;
  expirationTask = sequelize.query(`
    UPDATE bookings b
    SET status = CASE WHEN b.payment_status = 'completed' THEN 'completed' ELSE 'cancelled' END,
        payment_status = CASE WHEN b.payment_status = 'completed' THEN 'completed' ELSE 'cancelled' END,
        updated_at = now()
    FROM escaperooms r
    WHERE b.escape_room_id = r.id AND b.status = 'active'
      AND ((b.date + b.time) AT TIME ZONE $1) + make_interval(mins => r.duration) <= now()
  `, { bind: [env.timezone] });
  try { await expirationTask; lastExpiration = Date.now(); }
  finally { expirationTask = undefined; }
}

async function availableSlots({ escape_room_id, start_date, end_date }) {
  const { first, last } = validateRange(start_date, end_date);
  const room = await EscapeRoom.findByPk(escape_room_id, { attributes: ["id", "duration"] });
  if (!room) throw new UserInputError("Quest room not found.");
  const occupied = await Booking.findAll({
    where: { escape_room_id, date: { [Op.between]: [start_date, end_date] }, status: { [Op.in]: ["active", "completed"] } },
    attributes: ["date", "time"],
  });
  const keys = new Set(occupied.map((booking) => `${booking.date}T${booking.time}`));
  const times = dailySlots(room.duration);
  const now = DateTime.now();
  const slots = [];
  for (let day = first; day <= last; day = day.plus({ days: 1 })) {
    const date = day.toISODate();
    for (const time of times) {
      const value = localDate(date, time);
      if (value > now && value <= now.plus({ days: 180 }) && !keys.has(`${date}T${time}`)) slots.push({ date, time });
    }
  }
  return slots;
}

function requireUser(context) {
  if (!context?.user) throw new AuthenticationError();
  return context.user;
}

async function ownedBooking(id, context, transaction, { payable = false } = {}) {
  const user = requireUser(context);
  const booking = await Booking.findByPk(id, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
  if (!booking) throw new UserInputError("Booking not found.");
  if (booking.user_id !== user.id && !user.isAdmin) throw new ForbiddenError();
  if (payable && (booking.status !== "active" || localDate(booking.date, booking.time) <= DateTime.now())) {
    throw new UserInputError("This booking can no longer be paid.");
  }
  return booking;
}

async function createBooking(input, context) {
  const user = requireUser(context);
  try {
    return await sequelize.transaction(async (transaction) => {
      const room = await EscapeRoom.findByPk(input.escape_room_id, { attributes: ["id", "playersMin", "playersMax", "price", "duration"], transaction, lock: transaction.LOCK.UPDATE });
      if (!room) throw new UserInputError("Quest room not found.");
      if (!Number.isInteger(input.numberOfPlayers) || input.numberOfPlayers < room.playersMin || input.numberOfPlayers > room.playersMax) {
        throw new UserInputError(`Number of players must be between ${room.playersMin} and ${room.playersMax}.`);
      }
      const time = validateBookingSlot(input.date, input.time, room.duration);
      return Booking.create({ ...input, time, user_id: user.id, payment_status: "pending", payment_amount: room.price * input.numberOfPlayers, status: "active" }, { transaction });
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw new UserInputError("This time slot is no longer available.");
    throw error;
  }
}

module.exports = { expireBookings, availableSlots, createBooking, requireUser, ownedBooking };
