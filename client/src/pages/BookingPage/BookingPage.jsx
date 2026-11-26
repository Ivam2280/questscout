import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { QUERY_ESCAPEROOM } from "../../utils/queries";
import BookingFormComponent from "../../components/BookingFormComponent/BookingForm";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import BookingConfirmationComponent from "../../components/BookingConfirmationComponent/BookingConfirmationComponent";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import ReviewList from "../../components/ReviewList/ReviewList";
import BookingCalendar from "../../components/BookingCalendar/BookingCalendar";
import SnackBar from "../../components/SnackBarComponent/SnackBar";
import {
  FaTheaterMasks,
  FaTrophy,
  FaUserFriends,
  FaMoneyBillWave,
  FaClock,
  FaChild,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
} from "react-icons/fa";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

    :root {
      --red: #c0392b;
      --red-hi: #e74c3c;
      --ink: #050505;
      --smoke: #111113;
      --ash: #1c1c1f;
      --fog: #2a2a2f;
      --slate: #a3a3b0;
      --pale: #e2e2ea;
      --white: #f5f5fa;
      --glass: rgba(255, 255, 255, 0.05);
      --border: rgba(255, 255, 255, 0.16);
      --border-light: rgba(255, 255, 255, 0.2);
      --focus-bg: rgba(192, 57, 43, 0.06);
    }

    .qs-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
      font-size: 16px;
      font-weight: 400;
    }

    .qs-display {
      font-family: 'Bebas Neue', cursive;
      letter-spacing: 0.04em;
    }

    .qs-condensed {
      font-family: 'Barlow Condensed', sans-serif;
    }

    .qs-page::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    .text-label {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--slate);
    }

    .text-value {
      font-size: 17px;
      font-weight: 500;
      color: var(--white);
    }

    .text-description {
      font-size: 20px;
      line-height: 1.75;
      color: var(--pale);
      font-weight: 400;
    }

    @media (min-width: 768px) {
      .text-description {
        font-size: 22px;
        line-height: 1.8;
      }
    }

    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: #0c0c0e;
      border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #3e3e45;
      border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #52525a;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: var(--red);
      background: rgba(192, 57, 43, 0.06);
    }

    .stat-icon {
      color: var(--red-hi);
      font-size: 28px;
      flex-shrink: 0;
    }

    .gallery-thumb {
      width: 96px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid var(--border);
      transition: all 0.2s ease;
      opacity: 0.7;
    }

    .gallery-thumb:hover {
      opacity: 1;
      border-color: var(--border-light);
    }

    .gallery-thumb.active {
      opacity: 1;
      border-color: var(--red);
    }

    .gallery-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .description-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 2.5rem 3rem;
    }

    @media (min-width: 768px) {
      .description-card {
        padding: 3rem 4rem;
      }
    }
  `}</style>
);

const RedStarRating = ({ rating = 0, maxStars = 5, size = 20 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[...Array(fullStars)].map((_, i) => (
        <FaStar
          key={`full-${i}`}
          style={{ color: "#e74c3c", fontSize: `${size}px` }}
        />
      ))}
      {hasHalfStar && (
        <FaStarHalfAlt
          key="half"
          style={{ color: "#e74c3c", fontSize: `${size}px` }}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <FaRegStar
          key={`empty-${i}`}
          style={{ color: "rgba(255,255,255,0.28)", fontSize: `${size}px` }}
        />
      ))}
      {rating > 0 && (
        <span
          style={{
            marginLeft: "8px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#f5f5fa",
          }}
        >
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

const BookingPage = () => {
  const { roomId } = useParams();
  const roomID = parseInt(roomId, 10);

  const [confirmationPage, setConfirmationPage] = useState(false);
  const [formData, setFormData] = useState({
    escape_room_id: roomID,
    numberOfPlayers: 1,
    date: "",
    time: "",
  });

  const [activeImage, setActiveImage] = useState("");
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  const { data, refetch } = useQuery(QUERY_ESCAPEROOM, {
    variables: { id: roomID },
  });
  const escapeRoom = data?.getEscapeRoom || {};

  useEffect(() => {
    if (escapeRoom.playersMin) {
      setFormData((prev) => ({
        ...prev,
        numberOfPlayers: escapeRoom.playersMin,
      }));
    }
    if (escapeRoom.image_url) {
      setActiveImage(escapeRoom.image_url);
    }
  }, [escapeRoom]);

  const handleSlotSelect = (slot) => {
    setFormData({ ...formData, date: slot.date, time: slot.time });
  };

  const handleReviewSuccess = () => {
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 3000);
  };

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
  };

  return (
    <>
      <GlobalStyles />
      <div className="qs-page py-12 px-6 lg:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {!confirmationPage ? (
              <motion.div
                key="booking"
                variants={pageTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col gap-16"
              >
                <div className="flex flex-col lg:flex-row gap-10 items-stretch">
                  <div className="lg:w-1/2 flex flex-col gap-4">
                    <div className="relative rounded-lg overflow-hidden border border-[var(--border)] shadow-2xl h-[400px]">
                      <img
                        src={activeImage || escapeRoom.image_url}
                        alt={escapeRoom.theme}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: "grayscale(15%)" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent opacity-70 pointer-events-none" />
                    </div>

                    {escapeRoom.gallery && escapeRoom.gallery.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                          onClick={() => setActiveImage(escapeRoom.image_url)}
                          className={`gallery-thumb ${
                            activeImage === escapeRoom.image_url ? "active" : ""
                          }`}
                        >
                          <img src={escapeRoom.image_url} alt="Main Cover" />
                        </button>
                        {escapeRoom.gallery.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(img)}
                            className={`gallery-thumb ${
                              activeImage === img ? "active" : ""
                            }`}
                          >
                            <img src={img} alt={`Gallery ${i}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:w-1/2 flex flex-col gap-6">
                    <div>
                      <h1 className="qs-display text-5xl md:text-6xl text-[var(--white)] uppercase leading-none mb-3">
                        {escapeRoom.theme}
                      </h1>
                      <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
                        <span className="qs-condensed text-xl font-semibold text-[var(--slate)] tracking-widest uppercase">
                          Mission Overview
                        </span>
                        <RedStarRating
                          rating={escapeRoom.averageRating || 0}
                          size={22}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-grow content-start">
                      {[
                        {
                          icon: <FaTheaterMasks />,
                          label: "Genre",
                          value: escapeRoom.genre,
                        },
                        {
                          icon: <FaTrophy />,
                          label: "Difficulty",
                          value: escapeRoom.difficulty,
                        },
                        {
                          icon: <FaChild />,
                          label: "Age Group",
                          value: escapeRoom.ageGroup,
                        },
                        {
                          icon: <FaClock />,
                          label: "Duration",
                          value: `${escapeRoom.duration} min`,
                        },
                        {
                          icon: <FaUserFriends />,
                          label: "Squad Size",
                          value: `${escapeRoom.playersMin}-${escapeRoom.playersMax}`,
                        },
                        {
                          icon: <FaMoneyBillWave />,
                          label: "Fee / Agent",
                          value: `${escapeRoom.price} UAH`,
                        },
                      ].map((stat, idx) => (
                        <div key={idx} className="stat-card">
                          <div className="stat-icon">{stat.icon}</div>
                          <div>
                            <p className="text-label">{stat.label}</p>
                            <p className="text-value">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full mt-2">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="qs-display text-4xl text-[var(--white)] uppercase tracking-widest">
                      Mission{" "}
                      <span className="text-[var(--red-hi)]">Briefing</span>
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>

                  <div className="description-card relative w-full shadow-lg">
                    <div className="relative z-10 max-w-5xl">
                      <p className="text-description whitespace-pre-wrap break-words">
                        {escapeRoom.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="scroll-mt-12" id="booking-section">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="qs-display text-4xl text-[var(--white)] uppercase tracking-widest">
                      Schedule{" "}
                      <span className="text-[var(--red-hi)]">Deployment</span>
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>

                  <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-stretch">
                    <BookingCalendar
                      escapeRoomId={roomID}
                      duration={escapeRoom.duration}
                      onSelectSlot={handleSlotSelect}
                    />
                    <BookingFormComponent
                      formData={formData}
                      setFormData={setFormData}
                      setConfirmationPage={setConfirmationPage}
                      escapeRoom={escapeRoom}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirmation"
                variants={pageTransition}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <BookingConfirmationComponent
                  bookingDetails={{
                    id:
                      typeof confirmationPage === "number"
                        ? confirmationPage
                        : "PENDING",
                    escapeRoomTheme: escapeRoom.theme,
                    escapeRoomImage: escapeRoom.image_url,
                    description: escapeRoom.description,
                    numberOfPlayers: formData.numberOfPlayers,
                    price: escapeRoom.price,
                    date: formData.date,
                    time: formData.time,
                  }}
                  setConfirmationPage={setConfirmationPage}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!confirmationPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 border-t border-[var(--border)] pt-16 w-full"
            >
              <div className="flex items-center gap-4 mb-8">
                <h2 className="qs-display text-4xl text-[var(--white)] uppercase tracking-widest">
                  Field <span className="text-[var(--red-hi)]">Reports</span>
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
              </div>

              <div className="flex flex-col gap-12 items-start w-full">
                <ReviewForm
                  escapeRoomId={roomID}
                  refetch={refetch}
                  onSuccess={handleReviewSuccess}
                />
                <ReviewList reviews={escapeRoom.reviews} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showReviewSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <SnackBar message="Report submitted successfully!" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollToTop(BookingPage);
