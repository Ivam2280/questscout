const { DateTime } = require("luxon");
const { env } = require("../config/env");
const { UserInputError } = require("../utils/errors");

function localDate(date, time = "00:00:00") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    throw new UserInputError("Use a valid date and time.");
  }
  const value = DateTime.fromISO(`${date}T${time}`, { zone: env.timezone });
  if (!value.isValid) throw new UserInputError("Use a valid date and time.");
  return value;
}

function dailySlots(duration) {
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) throw new UserInputError("Duration must be between 15 and 240 minutes.");
  const times = [];
  for (let minutes = 600; minutes + duration <= 1320; minutes += duration) {
    times.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`);
  }
  return times;
}

function validateRange(start, end) {
  const first = localDate(start);
  const last = localDate(end);
  if (last < first || last.diff(first, "days").days > 62) throw new UserInputError("Select a date range of up to 63 days.");
  return { first, last };
}

function validateBookingSlot(date, time, duration, now = DateTime.now()) {
  const value = localDate(date, time);
  const canonicalTime = value.toFormat("HH:mm:ss");
  if (!dailySlots(duration).includes(canonicalTime)) throw new UserInputError("Choose a time from the available slots.");
  if (value <= now) throw new UserInputError("Choose a future time slot.");
  if (value > now.plus({ days: 180 })) throw new UserInputError("Bookings are available up to 180 days ahead.");
  return canonicalTime;
}

module.exports = { dailySlots, localDate, validateRange, validateBookingSlot };
