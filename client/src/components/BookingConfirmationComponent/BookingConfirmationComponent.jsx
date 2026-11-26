import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client";
import { QUERY_SINGLEBOOKING } from "../../utils/queries";
import {
  FaUserFriends,
  FaClock,
  FaCalendarAlt,
  FaReceipt,
  FaCreditCard,
  FaCheckCircle
} from "react-icons/fa";
import PayPalPaymentModal from "../PayPalPaymentModal/PayPalPaymentModal";

// ─── Animation variants ────────────────────────────────────────────────────────

// Весь білет — падає зверху з пружинним відскоком
const ticketVariants = {
  hidden: { opacity: 0, y: -120, rotateX: 25, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: [0.22, 1.2, 0.36, 1],
      opacity: { duration: 0.3 },
    },
  },
};

// Ліва панель (фото) — виїжджає зліва
const leftPanelVariants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

// Права панель (деталі) — виїжджає справа
const rightPanelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

// Stagger-контейнер для вмісту правої панелі
const contentContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.55,
    },
  },
};

// Кожен рядок — знизу вгору з розмиттям
const contentItemVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

// Лінія-сканер — проходить по білету один раз після появи
const scanLineVariants = {
  hidden: { opacity: 0, x: "-100%" },
  visible: {
    opacity: [0, 0.9, 0.9, 0],
    x: "120%",
    transition: { duration: 1.1, ease: "easeInOut", delay: 0.9 },
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

const BookingConfirmationComponent = ({
  bookingDetails,
  setConfirmationPage,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => { window.scrollTo(0, 0); }, 50);
    return () => clearTimeout(timer);
  }, []);

  const totalPrice = bookingDetails.price * bookingDetails.numberOfPlayers;
  const bookingId = bookingDetails.id;

  // Динамічно отримуємо статус платежу з кешу Apollo
  const { data: bookingData } = useQuery(QUERY_SINGLEBOOKING, {
    variables: { booking_id: bookingId },
    skip: typeof bookingId !== "number",
  });

  const isPaid = bookingData?.getSingleBooking?.payment_status === "completed";

  const summaryItems = [
    { label: "Squad Size",      value: `${bookingDetails.numberOfPlayers} Agents`, icon: <FaUserFriends /> },
    { label: "Deployment Date", value: dayjs(bookingDetails.date).format("MMM D, YYYY"), icon: <FaCalendarAlt /> },
    { label: "Sync Time",       value: dayjs(`2023-01-01T${bookingDetails.time}`).format("HH:mm"), icon: <FaClock /> },
    { label: "Authorized Fee",  value: `${totalPrice} UAH`, highlight: true, icon: <FaReceipt /> },
  ];

  return (
    <>
      <div
        className="flex items-start justify-center pt-2 md:pt-6 pb-12 relative z-10 w-full min-h-[70vh]"
        style={{ perspective: "1400px" }}
      >
        {/* ── Весь білет падає зверху з 3D-нахилом ── */}
        <motion.div
          variants={ticketVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1080px] w-full mx-auto drop-shadow-2xl relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Обрізані кути */}
          <div
            className="relative w-full h-full"
            style={{
              WebkitMaskImage:
                "radial-gradient(circle at top left, transparent 24px, black 25px), radial-gradient(circle at top right, transparent 24px, black 25px), radial-gradient(circle at bottom left, transparent 24px, black 25px), radial-gradient(circle at bottom right, transparent 24px, black 25px)",
              WebkitMaskSize: "51% 51%",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "top left, top right, bottom left, bottom right",
              maskImage:
                "radial-gradient(circle at top left, transparent 24px, black 25px), radial-gradient(circle at top right, transparent 24px, black 25px), radial-gradient(circle at bottom left, transparent 24px, black 25px), radial-gradient(circle at bottom right, transparent 24px, black 25px)",
              maskSize: "51% 51%",
              maskRepeat: "no-repeat",
              maskPosition: "top left, top right, bottom left, bottom right",
              overflow: "hidden",
            }}
          >
            {/* Зубчики */}
            <div
              className="bg-[var(--smoke)] flex flex-col lg:flex-row relative min-h-[380px] w-full overflow-hidden"
              style={{
                WebkitMaskImage:
                  "radial-gradient(circle at 0% 50%, transparent 8px, black 8.5px), radial-gradient(circle at 100% 50%, transparent 8px, black 8.5px)",
                WebkitMaskSize: "51% 32px",
                WebkitMaskRepeat: "repeat-y, repeat-y",
                WebkitMaskPosition: "left top, right top",
                maskImage:
                  "radial-gradient(circle at 0% 50%, transparent 8px, black 8.5px), radial-gradient(circle at 100% 50%, transparent 8px, black 8.5px)",
                maskSize: "51% 32px",
                maskRepeat: "repeat-y, repeat-y",
                maskPosition: "left top, right top",
              }}
            >
              {/* Текстура шуму */}
              <div
                className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-[0.15]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* ── Лінія-сканер (червона смуга, проходить один раз) ── */}
              <motion.div
                variants={scanLineVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-y-0 left-0 w-[40%] z-30 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(192,57,43,0.12) 30%, rgba(231,76,60,0.6) 50%, rgba(192,57,43,0.12) 70%, transparent 100%)",
                }}
              />

              {/* ── ЛІВА ПАНЕЛЬ — виїжджає зліва ── */}
              <motion.div
                variants={leftPanelVariants}
                initial="hidden"
                animate="visible"
                className="relative w-full lg:w-[70%] min-h-[260px] lg:min-h-full z-10 overflow-hidden"
              >
                <img
                  src={bookingDetails.escapeRoomImage}
                  alt={bookingDetails.escapeRoomTheme}
                  className="absolute inset-0 w-full h-full object-cover filter grayscale-[15%] opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--smoke)] via-[rgba(17,17,19,0.3)] to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[var(--smoke)]" />

                {/* Назва кімнати — з'являється окремо */}
                <motion.div
                  className="absolute bottom-8 left-10 right-10"
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.7, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="font-['Bebas_Neue',cursive] text-4xl md:text-6xl text-white leading-none mb-1 drop-shadow-lg">
                    {bookingDetails.escapeRoomTheme}
                  </h2>
                </motion.div>
              </motion.div>

              {/* Лінія відриву */}
              <div className="hidden lg:block absolute top-0 bottom-0 left-[70%] w-0 border-l-[3px] border-dotted border-[rgba(255,255,255,0.15)] z-20 pointer-events-none" />
              <div className="lg:hidden w-full h-0 border-t-[3px] border-dotted border-[rgba(255,255,255,0.15)] relative z-20 opacity-50 pointer-events-none" />

              {/* ── ПРАВА ПАНЕЛЬ — виїжджає справа ── */}
              <motion.div
                variants={rightPanelVariants}
                initial="hidden"
                animate="visible"
                className="p-6 md:p-8 w-full lg:w-[30%] flex flex-col justify-between relative z-10 bg-[rgba(255,255,255,0.01)] backdrop-blur-sm"
              >
                {/* Stagger-контейнер */}
                <motion.div
                  variants={contentContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col h-full"
                >
                  {/* Booking ID */}
                  <motion.div
                    variants={contentItemVariants}
                    className="flex justify-between items-start border-b border-[rgba(255,255,255,0.05)] pb-4 mb-6"
                  >
                    <div>
                      <p className="font-['Barlow_Condensed',sans-serif] text-[11px] text-[var(--slate)] tracking-[0.2em] uppercase mb-1">
                        Booking ID
                      </p>
                      <p className="font-mono text-[var(--pale)] text-lg tracking-widest">{bookingId}</p>
                    </div>
                  </motion.div>

                  {/* Summary items */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-y-6 gap-x-4 mb-8 flex-grow content-center relative z-30">
                    {summaryItems.map((item, index) => (
                      <motion.div key={index} variants={contentItemVariants} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[var(--slate)]">
                          <span className="text-[var(--red)] text-sm">{item.icon}</span>
                          <span className="font-['Barlow_Condensed',sans-serif] text-[11px] tracking-[0.15em] uppercase">
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={`font-['Bebas_Neue',cursive] text-2xl tracking-wider ${
                            item.highlight ? "text-[var(--red)]" : "text-[var(--white)]"
                          }`}
                        >
                          {item.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Кнопки */}
                  <motion.div
                    variants={contentItemVariants}
                    className="mt-auto pt-5 border-t border-[rgba(255,255,255,0.05)] relative z-30 flex gap-3"
                  >
                    <Link
                      to="/mybookings"
                      onClick={() => setConfirmationPage(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[var(--red)] text-white cursor-pointer font-['Barlow_Condensed',sans-serif] font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:shadow-[0_0_30px_rgba(231,76,60,0.4)] rounded-sm text-center"
                    >
                      VIEW MY BOOKINGS
                    </Link>
                    {isPaid ? (
                      <div
                        className="w-[60px] flex shrink-0 items-center justify-center bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[#4ade80] rounded-sm"
                        title="Paid"
                      >
                        <FaCheckCircle size={20} />
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-[60px] flex shrink-0 items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[var(--red)] hover:border-[var(--red-hi)] transition-all duration-300 rounded-sm"
                        title="Pay Now"
                      >
                        <FaCreditCard size={20} />
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* PayPal Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PayPalPaymentModal
            amount={totalPrice}
            onClose={() => setShowPaymentModal(false)}
            bookingId={bookingId}
            bookingStatus={isPaid ? "completed" : "pending"}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingConfirmationComponent;
