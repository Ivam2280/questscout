const test = require("node:test");
const assert = require("node:assert/strict");
const { DateTime } = require("luxon");
const { dailySlots, localDate, validateRange, validateBookingSlot } = require("../services/schedule");

test("slots end within business hours, including 90-minute rooms", () => {
  assert.equal(dailySlots(60).length, 12);
  assert.equal(dailySlots(60).at(-1), "21:00:00");
  assert.equal(dailySlots(90).at(-1), "20:30:00");
  assert.equal(dailySlots(90).length, 8);
  assert.throws(() => dailySlots(0));
});
test("invalid dates and oversized calendar ranges are rejected", () => {
  assert.throws(() => localDate("2026-02-30"));
  assert.throws(() => localDate("2026-05-01", "25:00"));
  assert.throws(() => validateRange("2026-05-10", "2026-05-01"));
  assert.throws(() => validateRange("2026-01-01", "2026-05-01"));
});
test("booking validation rejects past times and off-schedule starts", () => {
  const now = DateTime.fromISO("2026-01-10T12:00:00", { zone: "Europe/Kyiv" });
  assert.equal(validateBookingSlot("2026-01-11", "10:00", 60, now), "10:00:00");
  assert.throws(() => validateBookingSlot("2026-01-09", "10:00", 60, now), /future/);
  assert.throws(() => validateBookingSlot("2026-01-11", "10:15", 60, now), /available/);
  assert.throws(() => validateBookingSlot("2027-01-11", "10:00", 60, now), /180/);
});
test("business times follow Kyiv's daylight-saving offset", () => {
  assert.equal(localDate("2026-01-15", "10:00").offset, 120);
  assert.equal(localDate("2026-07-15", "10:00").offset, 180);
});
