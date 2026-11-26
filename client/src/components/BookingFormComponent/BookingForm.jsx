import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { FaLock, FaMinus, FaPlus } from "react-icons/fa";
import { useUserBookingsContext } from "../../utils/UserBookingsContext";
import Auth from "../../utils/auth";
import SnackBar from "../SnackBarComponent/SnackBar";

const GlobalStyles = () => (
  <style>{`
    .booking-form {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 2rem;
      border-radius: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      font-family: 'DM Sans', sans-serif;
    }

    @media (min-width: 768px) {
      .booking-form {
        padding: 2.5rem;
      }
    }

    .bf-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #c0c0ca;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    /* --- Squad size stepper --- */
    .bf-squad-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 16px 20px;
    }

    .bf-stepper-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }

    .bf-stepper-btn {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #d0d0da;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .bf-stepper-btn:hover:not(:disabled) {
      border-color: #e74c3c;
      color: #ffffff;
      background: rgba(231, 76, 60, 0.1);
    }

    .bf-stepper-btn:active:not(:disabled) {
      transform: scale(0.92);
    }

    .bf-stepper-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .bf-stepper-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 64px;
    }

    .bf-stepper-number {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 32px;
      line-height: 1;
      font-weight: 700;
      color: #f5f5fa;
      font-variant-numeric: tabular-nums;
    }

    .bf-stepper-caption {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #8a8a96;
      margin-top: 3px;
    }

    .bf-squad-icons {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .bf-squad-icon {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      transition: all 0.25s ease;
    }

    .bf-squad-icon.filled {
      background: #c0392b;
      border-color: #e74c3c;
      box-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
    }

    .bf-summary-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 22px;
      border-radius: 10px;
      margin-top: auto;
    }

    .bf-summary-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #c0c0ca;
    }

    .bf-summary-value {
      font-size: 19px;
      font-weight: 600;
      color: #f0f0f5;
    }

    .bf-summary-value-red {
      font-size: 19px;
      font-weight: 600;
      color: #e74c3c;
      margin-left: 12px;
    }

    .bf-slot-placeholder {
      font-size: 17px;
      font-weight: 500;
      color: #e74c3c;
    }

    .bf-total-price {
      font-size: 27px;
      font-weight: 700;
      color: #f5f5fa;
    }

    .bf-total-details {
      font-size: 16px;
      color: #c0c0ca;
      margin-top: 6px;
      font-weight: 500;
    }

    .bf-submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 20px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: #c0392b;
      color: #ffffff;
      border: 1px solid #e74c3c;
    }

    .bf-submit-btn:hover:not(:disabled) {
      background: #e74c3c;
      border-color: #ff6b5a;
    }

    .bf-submit-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: #2a2a2f;
      border-color: #2a2a2f;
      color: #8a8a96;
    }

    .bf-submit-btn.locked {
      background: #2a2a2f;
      border-color: #2a2a2f;
      color: #8a8a96;
      opacity: 0.6;
      cursor: not-allowed;
    }

    .bf-divider {
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
  `}</style>
);

const BookingForm = ({
  formData,
  setFormData,
  setConfirmationPage,
  escapeRoom,
}) => {
  const { createABooking } = useUserBookingsContext();
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoggedIn = Auth.loggedIn();

  const minPlayers = escapeRoom?.playersMin ?? 1;
  const maxPlayers = escapeRoom?.playersMax ?? 1;

  useEffect(() => {
    if (!escapeRoom) return;
    setFormData((current) => {
      if (current.numberOfPlayers && current.numberOfPlayers >= minPlayers) return current;
      return { ...current, numberOfPlayers: minPlayers };
    });
  }, [escapeRoom, minPlayers, setFormData]);

  const openSnackBar = () => {
    setShowSnackBar(true);
    setTimeout(() => setShowSnackBar(false), 3000);
  };

  const calculateTotalPrice = () => {
    if (!escapeRoom) return 0;
    return escapeRoom.price * formData.numberOfPlayers;
  };

  const adjustPlayers = (delta) => {
    const next = (formData.numberOfPlayers || minPlayers) + delta;
    if (next < minPlayers || next > maxPlayers) return;
    setFormData({ ...formData, numberOfPlayers: next });
  };

  const bookRoom = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      openSnackBar();
      return;
    }

    setIsSubmitting(true);

    if (!formData.date || !formData.time) {
      openSnackBar();
      setIsSubmitting(false);
      return;
    }

    try {
      const newBooking = await createABooking({
        escape_room_id: formData.escape_room_id,
        numberOfPlayers: formData.numberOfPlayers,
        date: formData.date,
        time: formData.time,
      });
      setConfirmationPage(newBooking.id);
    } catch (err) {
      console.error("Booking failed:", err);
      openSnackBar();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="booking-form">
        <form
          id="booking-form"
          onSubmit={bookRoom}
          className="flex flex-col gap-4 flex-grow"
        >
          {/* Players Selection */}
          <div>
            <div className="bf-squad-card">
              <div className="bf-stepper-row">
                <button
                  type="button"
                  className="bf-stepper-btn"
                  onClick={() => adjustPlayers(-1)}
                  disabled={formData.numberOfPlayers <= minPlayers}
                  aria-label="Remove agent"
                >
                  <FaMinus />
                </button>

                <div className="bf-stepper-display">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={formData.numberOfPlayers}
                      className="bf-stepper-number"
                      initial={{ opacity: 0, y: 8, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.85 }}
                      transition={{ duration: 0.18 }}
                    >
                      {formData.numberOfPlayers || minPlayers}
                    </motion.span>
                  </AnimatePresence>
                  <span className="bf-stepper-caption">
                    {formData.numberOfPlayers === 1 ? "Agent" : "Agents"}
                  </span>
                </div>

                <button
                  type="button"
                  className="bf-stepper-btn"
                  onClick={() => adjustPlayers(1)}
                  disabled={formData.numberOfPlayers >= maxPlayers}
                  aria-label="Add agent"
                >
                  <FaPlus />
                </button>
              </div>

              <div className="bf-squad-icons">
                {Array.from(
                  { length: maxPlayers - minPlayers + 1 },
                  (_, idx) => minPlayers + idx
                ).map((num) => (
                  <span
                    key={num}
                    className={`bf-squad-icon ${
                      num <= (formData.numberOfPlayers || minPlayers) ? "filled" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Selected Slot & Price */}
          <div className="bf-summary-card">
            <div className="flex justify-between items-center bf-divider">
              <span className="bf-summary-label">Schedule</span>
              {formData.date && formData.time ? (
                <span className="bf-summary-value">
                  {dayjs(formData.date).format("MMM D, YYYY")}
                  <span className="bf-summary-value-red">
                    {formData.time.split(":").slice(0, 2).join(":")}
                  </span>
                </span>
              ) : (
                <span className="bf-slot-placeholder">
                  Select a slot
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="bf-summary-label">Total Fee</span>
              <div className="text-right">
                <span className="bf-total-price">
                  {calculateTotalPrice()} UAH
                </span>
                <div className="bf-total-details">
                  {escapeRoom?.price || 0} UAH × {formData.numberOfPlayers} agents
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-2">
            {!isLoggedIn ? (
              <button
                type="button"
                disabled
                className="bf-submit-btn locked"
              >
                <FaLock size={18} />
                Confirm Authorization
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.date || !formData.time}
                className="bf-submit-btn"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : formData.date && formData.time ? (
                  "Confirm Authorization"
                ) : (
                  "Awaiting Time Selection"
                )}
              </button>
            )}
          </div>
        </form>

        <AnimatePresence>
          {showSnackBar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <SnackBar
                message={
                  !isLoggedIn
                    ? "Please log in to book a quest"
                    : "Please select a date and time for your booking"
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default BookingForm;
