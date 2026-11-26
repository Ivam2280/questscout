import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_REVIEW } from "../../utils/mutations";
import Auth from "../../utils/auth";
import { FaLock, FaStar, FaRegStar } from "react-icons/fa";

const GlobalStyles = () => (
  <style>{`
    .review-form {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 2rem;
      border-radius: 12px;
      width: 100%;
      font-family: 'DM Sans', sans-serif;
    }

    @media (min-width: 768px) {
      .review-form {
        padding: 2.5rem;
      }
    }

    .rf-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #f0f0f5;
      margin-bottom: 24px;
    }

    .rf-label {
      display: block;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #c0c0ca;
      margin-bottom: 14px;
    }

    .rf-locked-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .rf-locked-icon {
      color: #6a6a75;
      margin-bottom: 16px;
      font-size: 36px;
    }

    .rf-locked-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #a0a0ab;
      margin-bottom: 8px;
    }

    .rf-locked-text {
      font-size: 16px;
      color: #8a8a96;
      font-weight: 400;
    }

    .rf-stars-container {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .rf-star-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 3px;
      transition: all 0.2s ease;
      color: rgba(255, 255, 255, 0.28);
    }

    .rf-star-btn:hover {
      color: #e74c3c;
      transform: scale(1.15);
    }

    .rf-star-btn.active {
      color: #e74c3c;
    }

    .rf-textarea {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #f0f0f5;
      padding: 16px;
      outline: none;
      font-size: 17px;
      font-weight: 400;
      line-height: 1.6;
      resize: none;
      min-height: 140px;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
    }

    .rf-textarea:focus {
      border-color: #e74c3c;
      background: rgba(231, 76, 60, 0.04);
    }

    .rf-textarea::placeholder {
      color: #6a6a75;
      font-size: 16px;
    }

    .rf-submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: fit-content;
      align-self: flex-start;
      padding: 18px 40px;
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

    .rf-submit-btn:hover:not(:disabled) {
      background: #e74c3c;
      border-color: #ff6b5a;
    }

    .rf-submit-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #2a2a2f;
      border-color: #2a2a2f;
      color: #8a8a96;
    }
  `}</style>
);

const RedStarInput = ({ rating, setRating, maxStars = 5, size = 28 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="rf-stars-container">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isActive = (hoverRating || rating) >= starValue;

        return (
          <button
            key={index}
            type="button"
            className={`rf-star-btn ${isActive ? "active" : ""}`}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(starValue === rating ? null : starValue)}
          >
            {isActive ? (
              <FaStar style={{ fontSize: `${size}px` }} />
            ) : (
              <FaRegStar style={{ fontSize: `${size}px` }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

const ReviewForm = ({ escapeRoomId, refetch, onSuccess }) => {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [createReview] = useMutation(CREATE_REVIEW);
  const isLoggedIn = Auth.loggedIn();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating && !comment) return;

    try {
      await createReview({
        variables: {
          escape_room_id: escapeRoomId,
          rating: rating,
          comment: comment,
        },
      });
      setRating(null);
      setComment("");
      if (onSuccess) onSuccess();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="review-form">
        <h3 className="rf-title">Leave Field Report</h3>

        {!isLoggedIn ? (
          <div className="rf-locked-container">
            <FaLock className="rf-locked-icon" />
            <p className="rf-locked-title">Authorization Required</p>
            <p className="rf-locked-text">
              Please log in to submit your field report
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="rf-label">Mission Rating</label>
              <RedStarInput rating={rating} setRating={setRating} size={32} />
            </div>

            <div>
              <label className="rf-label">Debriefing Comment</label>
              <textarea
                className="rf-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
              />
            </div>

            <button
              type="submit"
              disabled={!rating && !comment}
              className="rf-submit-btn"
            >
              Submit Report
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ReviewForm;
