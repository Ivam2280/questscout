import { useRuntimeConfig } from "../../config";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { QUERY_AVAILABLESLOTS } from "../../utils/queries";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import ArrowLeft from "@mui/icons-material/ArrowLeft";
import ArrowRight from "@mui/icons-material/ArrowRight";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(timezone);

const GlobalStyles = () => (
  <style>{`
    .booking-calendar {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 12px;
      padding: 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      font-family: 'DM Sans', sans-serif;
    }

    @media (min-width: 768px) {
      .booking-calendar {
        padding: 2.5rem;
      }
    }

    .bc-nav-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #b0b0ba;
      transition: color 0.2s ease;
      cursor: pointer;
    }

    .bc-nav-btn:hover:not(:disabled) {
      color: #ffffff;
    }

    .bc-nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      color: #6a6a75;
    }

    .bc-month-title {
      font-family: 'Bebas Neue', cursive;
      font-size: 30px;
      color: #f0f0f5;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    @media (min-width: 768px) {
      .bc-month-title {
        font-size: 34px;
      }
    }

    .bc-weekdays-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .bc-day-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      border-radius: 6px 6px 0 0;
      transition: all 0.2s ease;
      color: #b0b0ba;
    }

    .bc-day-btn:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #e0e0ea;
    }

    .bc-day-btn.selected {
      border-bottom-color: #e74c3c;
      background: rgba(231, 76, 60, 0.08);
      color: #ffffff;
    }

    .bc-day-btn.inactive {
      color: #e05a4d;
      cursor: not-allowed;
      pointer-events: none;
    }

    .bc-day-btn.inactive:hover {
      background: transparent;
      color: #e05a4d;
    }

    .bc-day-btn.inactive.selected {
      color: #ffffff;
    }

    .bc-day-name {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 4px;
    }

    .bc-day-number {
      font-family: 'Bebas Neue', cursive;
      font-size: 28px;
      line-height: 1;
    }

    .bc-day-number.today {
      position: relative;
    }

    .bc-day-number.today::after {
      content: "";
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #e74c3c;
      box-shadow: 0 0 4px rgba(231, 76, 60, 0.6);
    }

    .bc-time-slot {
      position: relative;
      padding: 14px 8px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .bc-time-slot.available {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #c0c0ca;
      cursor: pointer;
    }

    .bc-time-slot.available:hover {
      border-color: #e74c3c;
      color: #ffffff;
      background: rgba(231, 76, 60, 0.06);
    }

    .bc-time-slot.selected {
      background: #c0392b;
      border: 1px solid #e74c3c;
      color: #ffffff;
      font-size: 17px;
    }

    /* --- Unavailable slot: modern crossed-out styling --- */
    .bc-time-slot.unavailable {
      background: rgba(231, 76, 60, 0.03);
      border: 1px solid rgba(231, 76, 60, 0.12);
      color: #7a6468;
      cursor: not-allowed;
    }

    .bc-time-slot.unavailable::before,
    .bc-time-slot.unavailable::after {
      content: "";
      position: absolute;
      left: -10%;
      width: 120%;
      height: 2px;
      top: 50%;
      background: linear-gradient(
        90deg,
        rgba(231, 76, 60, 0) 0%,
        rgba(231, 76, 60, 0.65) 15%,
        rgba(231, 76, 60, 0.85) 50%,
        rgba(231, 76, 60, 0.65) 85%,
        rgba(231, 76, 60, 0) 100%
      );
      box-shadow: 0 0 6px rgba(231, 76, 60, 0.35);
      pointer-events: none;
    }

    .bc-time-slot.unavailable::before {
      transform: translateY(-50%) rotate(22deg);
    }

    .bc-time-slot.unavailable::after {
      transform: translateY(-50%) rotate(-22deg);
    }

    .bc-error {
      padding: 1.5rem;
      background: rgba(231, 76, 60, 0.08);
      border: 1px solid rgba(231, 76, 60, 0.3);
      border-radius: 10px;
      text-align: center;
      color: #e74c3c;
      font-size: 16px;
      font-weight: 500;
    }
  `}</style>
);

const BookingCalendar = ({ escapeRoomId, duration, onSelectSlot }) => {
  const features = useRuntimeConfig();
  const now = dayjs().tz(features.timezone);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    now.startOf("isoWeek")
  );
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});

  const workingHours = { start: 10, end: 22 };

  const generatePossibleSlots = () => {
    const slots = [];
    let currentTime = now.hour(workingHours.start).minute(0).second(0);
    const endTime = now.hour(workingHours.end).minute(0).second(0);

    while (currentTime.isBefore(endTime)) {
      const slotEndTime = currentTime.add(duration, "minute");
      if (slotEndTime.isAfter(endTime)) break;
      slots.push(currentTime.format("HH:mm:ss"));
      currentTime = currentTime.add(duration, "minute");
    }
    return slots;
  };

  const possibleSlots = generatePossibleSlots();
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    currentWeekStart.add(i, "day")
  );

  const { error, data } = useQuery(QUERY_AVAILABLESLOTS, {
    variables: {
      escape_room_id: escapeRoomId,
      start_date: currentWeekStart.format("YYYY-MM-DD"),
      end_date: currentWeekStart.add(6, "day").format("YYYY-MM-DD"),
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (data?.availableSlots) {
      const slotsByDate = {};
      data.availableSlots.forEach((slot) => {
        const date = dayjs(slot.date).format("YYYY-MM-DD");
        if (!slotsByDate[date]) slotsByDate[date] = [];
        slotsByDate[date].push(slot.time);
      });
      setAvailableSlots(slotsByDate);

      const today = dayjs().tz(features.timezone);
      const isCurrentWeek = currentWeekStart.isSame(
        today.startOf("isoWeek"),
        "week"
      );
      setSelectedDate(isCurrentWeek ? today : currentWeekStart);
      setSelectedTime(null);
      onSelectSlot({ date: null, time: null });
    }
  }, [data, currentWeekStart]);

  const changeWeek = (week) => {
    setCurrentWeekStart(week);
    setSelectedDate(week);
    setSelectedTime(null);
    setAvailableSlots({});
    onSelectSlot({ date: null, time: null });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    onSelectSlot({ date: null, time: null });
  };

  const handleTimeSelect = (time) => {
    if (selectedTime === time) {
      setSelectedTime(null);
      onSelectSlot({ date: null, time: null });
    } else {
      setSelectedTime(time);
      onSelectSlot({ date: selectedDate.format("YYYY-MM-DD"), time });
    }
  };

  const isSlotAvailable = (date, time) => {
    const dateStr = date.format("YYYY-MM-DD");
    if (dayjs.tz(`${dateStr}T${time}`, features.timezone).isBefore(dayjs())) return false;
    return availableSlots[dateStr]?.includes(time);
  };

  if (error) {
    return (
      <div className="bc-error">
        Error loading slots: {error.message}
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="booking-calendar">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => {
              const newStart = currentWeekStart.subtract(7, "day");
              if (newStart.isSameOrAfter(now.startOf("isoWeek"))) {
                changeWeek(newStart);
              }
            }}
            disabled={currentWeekStart.isSame(now.startOf("isoWeek"))}
            className="bc-nav-btn"
          >
            <ArrowLeft fontSize="small" /> Prev
          </button>
          <h3 className="bc-month-title">
            {currentWeekStart.format("MMMM YYYY")}
          </h3>
          <button
            onClick={() => {
              changeWeek(currentWeekStart.add(7, "day"));
            }}
            className="bc-nav-btn"
          >
            Next <ArrowRight fontSize="small" />
          </button>
        </div>

        <p style={{ color: "#a3a3b0", fontSize: 13, marginBottom: 16 }}>All times are Kyiv time.</p>
        <div className="flex justify-between bc-weekdays-header">
          {weekDays.map((day) => {
            const isSelected = selectedDate?.isSame(day, "day");
            const isToday = day.isSame(now, "day");
            const isPast = day.isBefore(now, "day");
            return (
              <button
                type="button"
                disabled={isPast}
                aria-label={day.format("dddd, MMMM D, YYYY")}
                key={day.format("YYYY-MM-DD")}
                onClick={() => !isPast && handleDateSelect(day)}
                className={`bc-day-btn ${isSelected ? "selected" : ""} ${
                  isPast ? "inactive" : ""
                }`}
              >
                <span className="bc-day-name">{day.format("ddd")}</span>
                <span
                  className={`bc-day-number ${
                    isToday && !isSelected ? "today" : ""
                  }`}
                >
                  {day.format("D")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate?.format("YYYY-MM-DD") || "empty"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
            >
              {possibleSlots.map((time) => {
                const isAvailable = isSlotAvailable(selectedDate, time);
                const timeFormatted = dayjs(`2023-01-01T${time}`).format(
                  "HH:mm"
                );
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    onClick={() => isAvailable && handleTimeSelect(time)}
                    disabled={!isAvailable}
                    className={`bc-time-slot ${
                      !isAvailable
                        ? "unavailable"
                        : isSelected
                        ? "selected"
                        : "available"
                    }`}
                  >
                    {timeFormatted}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default BookingCalendar;
