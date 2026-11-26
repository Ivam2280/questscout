import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

// Компонент червоних зірок для списку відгуків
const RedStarDisplay = ({ rating = 0, maxStars = 5, size = 22 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
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
          style={{ color: "rgba(255,255,255,0.25)", fontSize: `${size}px` }}
        />
      ))}
    </div>
  );
};

const GlobalStyles = () => (
  <style>{`
    .review-list {
      width: 100%;
    }

    .rl-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #f0f0f5;
      margin-bottom: 12px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .rl-empty {
      font-size: 22px;
      color: #a0a0ab;
      font-style: italic;
      margin-top: 20px;
      font-weight: 400;
    }

    .rl-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 28px;
      border-radius: 12px;
      width: 100%;
      margin-bottom: 14px;
    }

    .rl-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .rl-user-name {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.02em;
      margin-bottom: 10px;
    }

    .rl-date {
      font-size: 16px;
      color: #8a8a96;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      white-space: nowrap;
    }

    .rl-comment {
      font-size: 21px;
      color: #e0e0ea;
      font-weight: 400;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .rl-reply {
      margin-top: 24px;
      padding: 22px;
      background: rgba(231, 76, 60, 0.06);
      border-left: 3px solid #e74c3c;
      border-radius: 0 8px 8px 0;
    }

    .rl-reply-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #e74c3c;
      margin-bottom: 8px;
    }

    .rl-reply-text {
      font-size: 19px;
      color: #e0e0ea;
      font-style: italic;
      font-weight: 400;
      line-height: 1.6;
    }

    .rl-btn-more {
      padding: 16px 36px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #d0d0da;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .rl-btn-more:hover {
      color: #ffffff;
      border-color: #e74c3c;
      background: rgba(231, 76, 60, 0.06);
    }

    .rl-btn-collapse {
      padding: 16px 28px;
      background: none;
      border: none;
      color: #8a8a96;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .rl-btn-collapse:hover {
      color: #e74c3c;
    }

    .rl-buttons-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 28px;
      width: 100%;
    }
  `}</style>
);

const ReviewList = ({ reviews }) => {
  const ITEMS_PER_PAGE = 3;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  if (!reviews || reviews.length === 0) {
    return (
      <>
        <GlobalStyles />
        <div className="review-list">
          <h3 className="rl-title">Agent Reports (0)</h3>
          <p className="rl-empty">No field reports available yet.</p>
        </div>
      </>
    );
  }

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  const hasLess = visibleCount >= reviews.length && reviews.length > ITEMS_PER_PAGE;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleShowLess = () => {
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <>
      <GlobalStyles />
      <div className="review-list">
        <h3 className="rl-title">Agent Reports ({reviews.length})</h3>

        <div className="flex flex-col w-full">
          <AnimatePresence initial={false}>
            {visibleReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden w-full"
              >
                <div className="rl-card">
                  <div className="rl-card-header">
                    <div>
                      <h4 className="rl-user-name">
                        {review.user.firstName} {review.user.lastName}
                      </h4>
                      {review.rating && (
                        <div className="mt-2">
                          <RedStarDisplay rating={review.rating} size={22} />
                        </div>
                      )}
                    </div>
                    <span className="rl-date">{review.created_at}</span>
                  </div>

                  {review.comment && (
                    <p className="rl-comment">{review.comment}</p>
                  )}

                  {review.reply && (
                    <div className="rl-reply">
                      <div className="rl-reply-label">Command Response:</div>
                      <p className="rl-reply-text">{review.reply}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {(hasMore || hasLess) && (
          <div className="rl-buttons-container">
            {hasMore && (
              <button onClick={handleShowMore} className="rl-btn-more">
                Load More Reports
              </button>
            )}
            {hasLess && (
              <button onClick={handleShowLess} className="rl-btn-collapse">
                Collapse
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewList;
