import React, { useState, useEffect } from "react";
import { useUserBookingsContext } from "../../utils/UserBookingsContext";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import PayPalPaymentModal from "../../components/PayPalPaymentModal/PayPalPaymentModal";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import SnackBar from "../../components/SnackBarComponent/SnackBar";
import { useQuery } from "@apollo/client";
import { QUERY_SINGLEBOOKING } from "../../utils/queries";
import {
  FaCalendarAlt, FaUsers, FaClock,
  FaDoorOpen, FaChevronRight, FaCreditCard,
  FaCheckCircle, FaBan,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red: #c0392b; --red-hi: #e74c3c; --gold: #d4a843;
      --ink: #0a0a0b; --smoke: #111113; --ash: #1c1c1f;
      --fog: #2a2a2f; --mist: #3e3e45; --slate: #8a8a96;
      --pale: #d6d6e0; --white: #f0f0f5;
    }

    .qs-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink); color: var(--white);
      min-height: 100vh; overflow-x: hidden;
    }
    .qs-display { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    .qs-page::before {
      content: ''; position: fixed; inset: 0; z-index: 999; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    @keyframes loader-spin { to { transform: rotate(360deg); } }
    @keyframes loader-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

    /* ── Standard card ── */
    .booking-card {
      background: var(--smoke); border: 1px solid var(--fog);
      border-radius: 4px; overflow: hidden;
      display: flex; flex-direction: column;
      transition: border-color 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .booking-card:hover { border-color: var(--mist); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }

    /* ── Wide card (single booking) ── */
    .booking-card-wide {
      background: var(--smoke); border: 1px solid var(--fog);
      border-radius: 4px; overflow: hidden;
      display: grid;
      grid-template-columns: 360px 1fr;
      transition: border-color 0.2s, box-shadow 0.2s;
      max-width: 935px;
      margin: 0 auto;
      min-height: 456px;
      cursor: pointer;
    }
    .booking-card-wide:hover { border-color: var(--mist); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }

    .wide-image-wrap {
      height: 100%;
    }

    /* ── Grid Layouts ── */
    .bookings-grid {
      display: grid;
      gap: 16px;
      width: 100%;
      margin: 0 auto;
    }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4plus { grid-template-columns: repeat(3, 1fr); }

    /* ── Wide wrappers: let 2 & 3+ booking grids use more of the page width ── */
    .bookings-grid-wide-2 {
      width: 72%;
      max-width: 1240px;
      margin: 0 auto;
      gap: 28px;
    }
    .bookings-grid-wide-3 {
      max-width: 1680px;
      gap: 24px;
    }
    .bookings-grid-wide-4plus {
      max-width: 1680px;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .grid-cols-3, .grid-cols-4plus {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .bookings-grid-wide-3, .bookings-grid-wide-4plus {
        max-width: 100%;
      }
    }

    @media (max-width: 768px) {
      .booking-card-wide {
        grid-template-columns: 1fr;
        max-width: 100%;
        min-height: auto;
      }
      .wide-image-wrap {
        height: 200px;
      }
      .grid-cols-2, .grid-cols-3, .grid-cols-4plus {
        grid-template-columns: 1fr !important;
      }
      .bookings-grid-wide-2, .bookings-grid-wide-3, .bookings-grid-wide-4plus {
        max-width: 100%;
      }
    }

    /* ── Buttons ── */
    .qs-btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px 20px;
      background: var(--red); color: white; border: none; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px;
      letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none;
      transition: background 0.2s, transform 0.15s;
    }
    .qs-btn-primary:hover { background: var(--red-hi); transform: translateY(-1px); }

    .qs-btn-secondary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 11px 20px;
      background: transparent; color: var(--slate); border: none; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none;
      transition: color 0.2s, background 0.2s;
    }
    .qs-btn-secondary:hover { color: var(--pale); background: rgba(255,255,255,0.03); }

    .qs-btn-success {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px 20px;
      background: rgba(34,197,94,0.15); color: #4ade80; border: none; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px;
      letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none;
      transition: background 0.2s, transform 0.15s;
    }
    .qs-btn-success:hover { background: rgba(34,197,94,0.22); transform: translateY(-1px); }

    .qs-btn-cancel {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px 20px;
      background: transparent; color: var(--pale); border: none; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px;
      letter-spacing: 0.15em; text-transform: uppercase;
      transition: color 0.2s, background 0.2s;
    }
    .qs-btn-cancel:hover { color: var(--red-hi); background: rgba(192,57,43,0.07); }

    /* ── Booking ID tag ── */
    .booking-id-tag {
      position: absolute; top: 12px; left: 12px; padding: 7px 14px;
      background: rgba(10,10,11,0.55); backdrop-filter: blur(8px);
      font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: #ffffff;
    }

    /* ═══════════════════════════════════════════
       NEW: Quest info — "boarding pass" style
    ═══════════════════════════════════════════ */
    .qs-quest-title {
      font-size: clamp(1.5rem, 2.3vw, 1.9rem);
      line-height: 1;
      color: var(--white);
      margin: 4px 0 18px;
    }
    .qs-quest-title-wide {
      font-size: clamp(2.1rem, 3.4vw, 2.9rem);
      line-height: 1;
      color: var(--white);
      margin: 4px 0 22px;
    }

    .qs-ticket-row {
      display: flex;
      position: relative;
      border-top: 1px dashed var(--mist);
      padding-top: 16px;
      margin-bottom: 16px;
    }
    .qs-ticket-stat {
      flex: 1;
      padding-right: 14px;
      position: relative;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .qs-ticket-stat + .qs-ticket-stat {
      padding-left: 14px;
    }
    .qs-ticket-stat:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0; top: 2px; bottom: 2px;
      width: 1px;
      background: var(--fog);
    }
    .qs-ticket-label {
      display: flex; align-items: center; flex-shrink: 0;
      color: var(--red-hi);
    }
    .qs-ticket-value {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 20px; font-weight: 400; letter-spacing: 0.01em;
      color: var(--white);
    }
    .qs-ticket-row-wide { padding-top: 22px; margin-bottom: 22px; flex: 1; align-items: center; }
    .qs-ticket-row-wide .qs-ticket-stat { gap: 14px; }
    .qs-ticket-row-wide .qs-ticket-value { font-size: 28px; }

    .qs-total-bar {
      border-top: 1px dashed var(--mist);
      padding-top: 16px; margin-bottom: 4px;
    }
    .qs-total-inner {
      display: flex; flex-direction: row; align-items: center; justify-content: space-between;
      width: 92%; margin: 0 auto;
    }
    .qs-total-label {
      display: block;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--pale);
    }
    .qs-total-right {
      display: flex; flex-direction: column; align-items: flex-end; text-align: right;
    }
    .qs-total-sub {
      display: block; font-size: 14px; font-weight: 500;
      color: var(--pale); margin-bottom: 5px;
    }
    .qs-total-value {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 24px; font-weight: 800; letter-spacing: 0.01em;
      color: var(--red-hi); line-height: 1;
    }
    .qs-total-bar-wide { padding-top: 22px; flex: 1; display: flex; align-items: center; }
    .qs-total-bar-wide .qs-total-label { font-size: 20px; }
    .qs-total-bar-wide .qs-total-sub { font-size: 16px; margin-bottom: 7px; }
    .qs-total-bar-wide .qs-total-value { font-size: 30px; }

    /* ═══════════════════════════════════════════
       NEW: Action buttons — Pay + Cancel in one row
    ═══════════════════════════════════════════ */
    .qs-action-row {
      display: grid; grid-template-columns: 1fr 1fr;
      border-top: 1px solid var(--fog);
    }
    .qs-action-row .qs-cta-half {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 16px 12px; border: none; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
      background: linear-gradient(135deg, var(--red), var(--red-hi));
      color: #ffffff;
      transition: transform 0.15s ease, background 0.2s ease;
    }
    .qs-action-row .qs-cta-half:hover { transform: translateY(-1px); }
    .qs-action-row .qs-cta-half.qs-cta-paid {
      background: linear-gradient(135deg, #22c55e, #4ade80);
      color: #04170b;
    }
    .qs-action-row .qs-btn-cancel-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 16px 12px; border: none; cursor: pointer;
      background: transparent; color: var(--pale);
      border-right: 1px solid var(--fog);
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
      transition: color 0.2s ease, background 0.2s ease;
    }
    .qs-action-row .qs-btn-cancel-row:hover { color: var(--red-hi); background: rgba(192,57,43,0.07); }

    .qs-action-row-lg .qs-cta-half,
    .qs-action-row-lg .qs-btn-cancel-row {
      padding: 20px 16px; font-size: 15px; letter-spacing: 0.16em; gap: 12px;
    }

    /* ── Modal & Dialog Overrides ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.82); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .modal-box {
      background: var(--smoke); border: 1px solid var(--fog);
      border-radius: 4px; box-shadow: 0 40px 100px rgba(0,0,0,0.8);
      width: 100%; max-width: 480px; overflow: hidden;
      display: flex; flex-direction: column; text-align: center;
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   CONFIRMATION BOX (Вбудований)
───────────────────────────────────────────── */
const ConfirmationBox = ({
  setDialogOpen,
  deleteBooking,
  currentBookingId,
  message = "Are you sure you want to cancel your booking?",
  isHistory = false,
}) => {
  const { data } = useQuery(QUERY_SINGLEBOOKING, {
    variables: { booking_id: currentBookingId },
  });

  const booking = data?.getSingleBooking || {};
  const showRefund = !isHistory && booking.payment_status === "completed";
  const refundAmount = showRefund
    ? booking?.payment_amount || 0
    : 0;

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div style={{ padding: "40px 32px 32px" }}>
          <div style={{ marginBottom: 20, color: "var(--red)", display: "flex", justifyContent: "center" }}>
            <FaBan size={40} />
          </div>
          <h2 className="qs-display" style={{ fontSize: "2.5rem", color: "var(--white)", marginBottom: 16 }}>
            Cancel Booking?
          </h2>
          <p style={{ color: "var(--slate)", fontSize: "15px", lineHeight: 1.6, marginBottom: 24 }}>
            {message}
          </p>
          {showRefund && refundAmount > 0 && (
            <div style={{ background: "rgba(34,197,94,0.1)", padding: "12px", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "4px" }}>
              <p style={{ color: "#4ade80", fontSize: "15px", fontWeight: 500, margin: 0 }}>
                {booking.payment_method?.includes("Demo") ? "This demo payment will be cancelled. No money was charged." : `${refundAmount} UAH will be refunded in PayPal Sandbox.`}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--fog)" }}>
          <button
            className="qs-btn-secondary"
            style={{ padding: "18px", borderRight: "1px solid var(--fog)" }}
            onClick={() => setDialogOpen(false)}
          >
            No, Keep It
          </button>
          <button
            className="qs-btn-primary"
            style={{ padding: "18px" }}
            onClick={() => {
              deleteBooking(currentBookingId);
              setDialogOpen(false);
            }}
          >
            Yes, Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────── */
const LoadingScreen = () => (
  <div className="qs-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
    <div style={{ width: 48, height: 48, border: "2px solid var(--fog)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "loader-spin 0.8s linear infinite" }} />
    <div className="qs-condensed" style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--slate)" }}>
      Loading your quests...
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   SHARED IMAGE BLOCK
───────────────────────────────────────────── */
const CardImage = ({ booking, fadeDirection = "top" }) => (
  <div style={{ position: "relative", overflow: "hidden", height: "100%", minHeight: 220 }}>
    <img
      src={booking.escaperoom.image_url}
      alt={booking.escaperoom.theme}
      style={{
        width: "100%", height: "100%", objectFit: "cover",
        filter: "grayscale(25%) contrast(1.1)", transition: "transform 0.5s",
      }}
      onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
      onMouseLeave={e => e.target.style.transform = "scale(1)"}
    />

    <div style={{
      position: "absolute", inset: 0, zIndex: 1,
      background: fadeDirection === "right"
        ? "linear-gradient(to right, transparent 55%, var(--smoke) 100%)"
        : "linear-gradient(to top, var(--smoke) 0%, transparent 55%)",
    }} />

    <div className="booking-id-tag qs-condensed" style={{ zIndex: 2 }}>id&nbsp;{booking.id}</div>
  </div>
);

/* ─────────────────────────────────────────────
   BOOKING CARD — standard (2+ bookings)
   Clicking anywhere on the card navigates to the room page.
   Pay and Cancel sit together in a single action row.
───────────────────────────────────────────── */
const BookingCard = ({ booking, index, onCancel, onPay }) => {
  const navigate = useNavigate();
  const isPaid = booking.payment_status === "completed";
  const totalPrice = booking.payment_amount;
  const playersText = `${booking.numberOfPlayers} player${booking.numberOfPlayers !== 1 ? "s" : ""}`;

  const goToRoom = () => navigate(`/booking/${booking.escape_room_id}`);

  return (
    <motion.div
      className="booking-card"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.45 }}
      layout
      onClick={goToRoom}
      role="button"
      tabIndex={0}
    >
      <div style={{ height: 200, flexShrink: 0 }}>
        <CardImage booking={booking} fadeDirection="top" />
      </div>

      <div style={{ padding: "20px 24px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 className="qs-display qs-quest-title">
          {booking.escaperoom.theme}
        </h3>

        <div className="qs-ticket-row">
          <div className="qs-ticket-stat">
            <span className="qs-ticket-label"><FaCalendarAlt size={18} /></span>
            <span className="qs-ticket-value">{booking.formattedDate}</span>
          </div>
          <div className="qs-ticket-stat">
            <span className="qs-ticket-label"><FaClock size={18} /></span>
            <span className="qs-ticket-value">{booking.time}</span>
          </div>
          <div className="qs-ticket-stat">
            <span className="qs-ticket-label"><FaUsers size={18} /></span>
            <span className="qs-ticket-value">{booking.numberOfPlayers}/{booking.escaperoom.playersMax}</span>
          </div>
        </div>

        <div className="qs-total-bar" style={{ marginBottom: 20 }}>
          <div className="qs-total-inner">
            <span className="qs-total-label">Total Due:</span>
            <div className="qs-total-right">
              <span className="qs-total-sub">{(totalPrice / booking.numberOfPlayers).toFixed(2)} UAH × {playersText}</span>
              <span className="qs-total-value">{totalPrice} UAH</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto" }} className="qs-action-row">
        <button
          className="qs-btn-cancel-row"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          <FaBan size={17} />Cancel
        </button>
        <button
          className={`qs-cta-half ${isPaid ? "qs-cta-paid" : ""}`}
          onClick={(e) => { e.stopPropagation(); onPay(); }}
        >
          {isPaid ? <><FaCheckCircle size={13} />Details</> : <><FaCreditCard size={13} />Pay Now</>}
        </button>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   BOOKING CARD — wide (single booking)
   Clicking anywhere on the card navigates to the room page.
   Pay and Cancel sit together in a single action row.
───────────────────────────────────────────── */
const BookingCardWide = ({ booking, onCancel, onPay }) => {
  const navigate = useNavigate();
  const isPaid = booking.payment_status === "completed";
  const totalPrice = booking.payment_amount;
  const playersText = `${booking.numberOfPlayers} player${booking.numberOfPlayers !== 1 ? "s" : ""}`;

  const goToRoom = () => navigate(`/booking/${booking.escape_room_id}`);

  return (
    <motion.div
      className="booking-card-wide"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={goToRoom}
      role="button"
      tabIndex={0}
    >
      <div className="wide-image-wrap">
        <CardImage booking={booking} fadeDirection="right" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 23 }}>
        <div style={{ padding: "32px 40px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 className="qs-display qs-quest-title-wide">
            {booking.escaperoom.theme}
          </h3>

          <div className="qs-ticket-row qs-ticket-row-wide">
            <div className="qs-ticket-stat">
              <span className="qs-ticket-label"><FaCalendarAlt size={24} /></span>
              <span className="qs-ticket-value">{booking.formattedDate}</span>
            </div>
            <div className="qs-ticket-stat">
              <span className="qs-ticket-label"><FaClock size={24} /></span>
              <span className="qs-ticket-value">{booking.time}</span>
            </div>
            <div className="qs-ticket-stat">
              <span className="qs-ticket-label"><FaUsers size={24} /></span>
              <span className="qs-ticket-value">{booking.numberOfPlayers}/{booking.escaperoom.playersMax}</span>
            </div>
          </div>

          <div className="qs-total-bar qs-total-bar-wide">
            <div className="qs-total-inner">
              <span className="qs-total-label">Total Due:</span>
              <div className="qs-total-right">
                <span className="qs-total-sub">{(totalPrice / booking.numberOfPlayers).toFixed(2)} UAH × {playersText}</span>
                <span className="qs-total-value">{totalPrice} UAH</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }} className="qs-action-row qs-action-row-lg">
          <button
            className="qs-btn-cancel-row"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
          >
            <FaBan size={20} />Cancel
          </button>
          <button
            className={`qs-cta-half ${isPaid ? "qs-cta-paid" : ""}`}
            onClick={(e) => { e.stopPropagation(); onPay(); }}
          >
            {isPaid ? <><FaCheckCircle size={16} />Details</> : <><FaCreditCard size={16} />Pay Now</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   HEADER DIVIDER
───────────────────────────────────────────── */
const HeaderDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14, marginBottom: 36 }}>
    <div style={{ width: 40, height: 1, background: "var(--fog)" }} />
    <div style={{ width: 6, height: 6, background: "var(--red)", transform: "rotate(45deg)", flexShrink: 0 }} />
    <div style={{ width: 40, height: 1, background: "var(--fog)" }} />
  </div>
);

/* ─────────────────────────────────────────────
   GRID COLUMNS (2+ bookings)
   Returns both the column class and a "wide" wrapper class
   so 2 and 3+ booking grids can occupy more of the page width.
───────────────────────────────────────────── */
const getGridClass = (count) => {
  if (count === 2) return "bookings-grid grid-cols-2 bookings-grid-wide-2";
  if (count === 3) return "bookings-grid grid-cols-3 bookings-grid-wide-3";
  return "bookings-grid grid-cols-4plus bookings-grid-wide-4plus";
};

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 24px",
      background: "var(--smoke)", border: "1px solid var(--fog)", textAlign: "center",
    }}
  >
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ marginBottom: 24 }}>
      <FaDoorOpen style={{ fontSize: 56, color: "var(--red)" }} />
    </motion.div>
    <h2 className="qs-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--white)", lineHeight: 1, marginBottom: 12 }}>
      No Active Bookings
    </h2>
    <p style={{ fontSize: 15, color: "var(--slate)", maxWidth: 360, lineHeight: 1.7, marginBottom: 32 }}>
      Your upcoming quest room adventures will appear here once you book a session.
    </p>
    <motion.div whileHover={{ x: 4 }}>
      <Link to="/escaperooms" style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
        fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase",
        padding: "16px 36px", background: "var(--red)", color: "white", textDecoration: "none",
        boxShadow: "0 0 40px rgba(192,57,43,0.35)",
      }}>
        Browse All Quests <FaChevronRight size={12} />
      </Link>
    </motion.div>
  </motion.div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const MyBookingsPage = () => {
  const { userBookings, deleteABooking, loading, error, refetch } = useUserBookingsContext();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const showSnack = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const deleteBooking = async (bookingId) => {
    try {
      const success = await deleteABooking(bookingId);
      showSnack(success ? "Booking cancelled successfully!" : "Could not cancel the booking. Please try again.");
    } catch (err) {
      showSnack(err.message || "Something went wrong. Please try again later.");
    }
  };

  if (loading) return <><GlobalStyles /><LoadingScreen /></>;
  if (error) return (
    <>
      <GlobalStyles />
      <div className="qs-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
        <div className="qs-display" style={{ fontSize: "2.5rem", color: "var(--red)" }}>Error</div>
        <p style={{ color: "var(--slate)", fontSize: 15 }}>{error.message}</p>
        <button className="qs-btn-primary" style={{ width: "auto", padding: "14px 32px" }} onClick={() => refetch()}>Try Again</button>
      </div>
    </>
  );

  const formattedBookings = userBookings?.map((booking) => ({
    ...booking,
    time: dayjs(`2023-01-01T${booking.time}`).format("HH:mm"),
    formattedDate: dayjs(booking.date).format("MMMM D"),
  }));

  const totalBookings = formattedBookings?.length ?? 0;

  const isWideLayout = totalBookings >= 2;

  return (
    <>
      <GlobalStyles />
      <div className="qs-page">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ padding: "10px clamp(20px, 5vw, 60px) 0", textAlign: "center" }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 32, height: 2, background: "var(--red)" }} />
              <span className="qs-condensed" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--red)" }}>
                Your Quests
              </span>
              <div style={{ width: 32, height: 2, background: "var(--red)" }} />
            </div>
            <h1 className="qs-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", lineHeight: 0.9, color: "var(--white)" }}>
              My <span style={{ color: "transparent", WebkitTextStroke: "2px var(--red)" }}>Bookings</span>
            </h1>
            <HeaderDivider />
          </motion.div>
        </div>

        <div
          style={{
            padding: isWideLayout ? "0 clamp(20px, 3vw, 40px) 60px" : "0 clamp(20px, 5vw, 60px) 60px",
            maxWidth: isWideLayout ? "none" : 1200,
            margin: "0 auto",
          }}
        >
          <AnimatePresence mode="wait">
            {totalBookings === 0 ? (
              <EmptyState key="empty" />
            ) : totalBookings === 1 ? (
              <BookingCardWide
                key="wide"
                booking={formattedBookings[0]}
                onCancel={() => { setCurrentBookingId(formattedBookings[0].id); setDialogOpen(true); }}
                onPay={() => { setSelectedBooking(formattedBookings[0]); setShowPaymentModal(true); }}
              />
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className={getGridClass(totalBookings)}
              >
                {formattedBookings.map((booking, index) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    index={index}
                    onCancel={() => { setCurrentBookingId(booking.id); setDialogOpen(true); }}
                    onPay={() => { setSelectedBooking(booking); setShowPaymentModal(true); }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showPaymentModal && selectedBooking && (
            <PayPalPaymentModal
              amount={selectedBooking.payment_amount}
              onClose={() => { setShowPaymentModal(false); refetch(); }}
              bookingId={selectedBooking.id}
              bookingStatus={selectedBooking.payment_status}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {dialogOpen && (
            <ConfirmationBox
              setDialogOpen={setDialogOpen}
              deleteBooking={deleteBooking}
              currentBookingId={currentBookingId}
              message="Are you sure you want to cancel this booking?"
              isHistory={false}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {snackbar.show && (
            <motion.div><SnackBar message={snackbar.message} /></motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ScrollToTop(MyBookingsPage);
