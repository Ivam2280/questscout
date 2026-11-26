import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { QUERY_ALLREVIEWS } from "../../utils/queries";
import { UPDATE_REVIEW, DELETE_REVIEW } from "../../utils/mutations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trash2, X, MessageSquare, Check, CheckCheck,
  Mail, Star, CornerDownRight, Clock, Home, CheckCircle2,
  Send, User, Calendar, ChevronRight, Sparkles, PenLine,
  MapPin, DoorOpen, AlertTriangle
} from "lucide-react";
import SnackBar from "../../components/SnackBarComponent/SnackBar";

const getInitials = (firstName, lastName) => {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return f + l;
};

const StarRow = ({ rating, max = 5 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-zinc-700"}
      />
    ))}
    <span className="ml-2 text-sm text-zinc-400">{rating}/{max}</span>
  </div>
);

const ReviewModal = ({ review, onClose, onSave, onDeleteReply }) => {
  const [replyText, setReplyText] = useState(review.reply || "");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteReply, setConfirmDeleteReply] = useState(false);
  const [isDeletingReply, setIsDeletingReply] = useState(false);
  const [localHasReply, setLocalHasReply] = useState(!!review.reply);

  const hasReply = localHasReply;

  const handleSave = async (text) => {
    setIsSaving(true);
    await onSave(text);
    setLocalHasReply(true);
    setIsSaving(false);
  };

  const handleDeleteReply = async () => {
    setIsDeletingReply(true);
    await onDeleteReply();
    setReplyText("");
    setLocalHasReply(false);
    setIsDeletingReply(false);
    setConfirmDeleteReply(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0c0c0e] border border-[#252528] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-auto overflow-hidden"
      >
        {/* ── HEADER ── */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#1a1a1e] border border-[#252528] flex items-center justify-center shrink-0">
                <User size={26} className="text-zinc-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white">
                  {review.user?.firstName} {review.user?.lastName}
                </h2>
                <p className="text-base text-zinc-500 mt-1 flex items-center gap-2">
                  <Mail size={16} />
                  {review.user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[#8a8a96] hover:text-white p-2 bg-[#050505] rounded border border-[#2a2a2f] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── REVIEW DETAILS PILLS ── */}
        <div className="flex flex-wrap items-center gap-2 px-6 pb-5">
          <div className="flex items-center gap-2 text-sm text-zinc-400 bg-[#1a1a1e] border border-[#252528] rounded-lg px-4 py-2">
            <DoorOpen size={16} className="text-orange-400" />
            <span className="text-zinc-300 font-medium">{review.escaperoom?.theme}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 bg-[#1a1a1e] border border-[#252528] rounded-lg px-4 py-2">
            <Calendar size={16} className="text-blue-400" />
            <span>{review.created_at}</span>
          </div>
          {review.rating && (
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-[#1a1a1e] border border-[#252528] rounded-lg px-4 py-2">
              <StarRow rating={review.rating} />
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* Customer Review Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-5 bg-[#e74c3c] rounded-full" />
              <p className="text-sm font-semibold tracking-[0.08em] uppercase text-zinc-500">
                Customer Review
              </p>
            </div>

            <div className="bg-[#1a1a1e] border border-[#252528] rounded-xl p-6">
              {review.comment ? (
                <p className="text-base text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                  {review.comment}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-base text-zinc-600 italic">
                  <Star size={18} className="text-zinc-700" />
                  Customer left a rating without a comment.
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#252528] to-transparent" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#252528] to-transparent" />
          </div>

          {/* Your Reply Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-[#e74c3c] rounded-full" />
                <p className="text-sm font-semibold tracking-[0.08em] uppercase text-zinc-500">
                  Your Response
                </p>
                {hasReply && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-full">
                    <CheckCircle2 size={12} />
                    Replied
                  </span>
                )}
              </div>

              {hasReply && !confirmDeleteReply && (
                <button
                  onClick={() => setConfirmDeleteReply(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
                  title="Delete reply"
                >
                  <Trash2 size={14} />
                  Delete reply
                </button>
              )}

              {hasReply && confirmDeleteReply && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Remove reply?</span>
                  <button
                    onClick={() => setConfirmDeleteReply(false)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 bg-[#1a1a1e] border border-[#252528] hover:bg-[#252528] hover:text-white transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteReply}
                    disabled={isDeletingReply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingReply ? (
                      <div className="w-4 h-4 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Confirm
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your public response to this review..."
                rows={6}
                className="w-full bg-[#1a1a1e] border border-[#252528] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-base text-white placeholder-zinc-600 rounded-xl px-5 py-5 leading-relaxed resize-none outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[#252528] bg-[#131316]">
          <button
            onClick={() => handleSave(replyText)}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-base bg-[#c0392b] hover:bg-[#e74c3c] text-white shadow-lg transition-colors border border-[#e74c3c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send size={16} />
                Save Response
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ManageReviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  const { loading, error, data, refetch } = useQuery(QUERY_ALLREVIEWS, { fetchPolicy: "network-only" });
  const [updateReview] = useMutation(UPDATE_REVIEW);
  const [deleteReview] = useMutation(DELETE_REVIEW);

  const showSnack = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleToggleReadStatus = async (reviewId, currentStatus) => {
    try {
      await updateReview({
        variables: { id: reviewId, input: { isRead: !currentStatus } },
      });
      showSnack(currentStatus ? "Marked as unread!" : "Marked as read!");
      refetch();
    } catch (err) {
      console.error(err);
      showSnack("Failed to update status.");
    }
  };

  const handleSaveReply = async (replyText) => {
    try {
      await updateReview({
        variables: {
          id: selectedReview.id,
          input: { reply: replyText, isRead: true },
        },
      });
      showSnack("Response saved successfully!");
      refetch();
    } catch (err) {
      console.error(err);
      showSnack("Error saving response.");
    }
  };

  const handleDeleteReply = async () => {
    try {
      await updateReview({
        variables: {
          id: selectedReview.id,
          input: { reply: "" },
        },
      });
      showSnack("Reply deleted.");
      refetch();
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete reply.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteReview({ variables: { id: deleteConfirmId } });
      showSnack("Review deleted!");
      refetch();
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete review.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const reviews = data?.getAllReviews || [];
  const unreadCount = reviews.filter((r) => !r.isRead).length;

  const filteredReviews = reviews.filter((review) => {
    if (filterMode === "unread" && review.isRead) return false;
    const q = searchQuery.toLowerCase();
    if (q) {
      return (
        review.user?.firstName.toLowerCase().includes(q) ||
        review.user?.lastName.toLowerCase().includes(q) ||
        review.escaperoom?.theme.toLowerCase().includes(q) ||
        review.id.toString().includes(q)
      );
    }
    return true;
  });

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e74c3c]" />
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 mt-10">Error: {error.message}</div>
  );

  return (
    <div className="flex flex-col gap-6 font-['DM_Sans',sans-serif] pb-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-2">
        <div className="flex flex-col gap-1 shrink-0">
          <h1 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">Manage Reviews</h1>
          <p className="text-[#b0b0ba] text-base">Read and respond to client field reports.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-end">
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#8a8a96] group-focus-within:text-[#e74c3c] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by params..."
              className="w-full bg-[#050505] border border-[#2a2a2f] text-[#e0e0ea] text-base rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#e74c3c]/50 focus:bg-[#1a1a1f] transition-all placeholder:text-[#6a6a75]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-[#050505] border border-[#2a2a2f] rounded-lg p-1 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                filterMode === "all" ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode("unread")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 relative ${
                filterMode === "unread" ? "bg-zinc-700 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Unread
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e74c3c] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      {filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111113] border border-[#2a2a2f] rounded-xl border-dashed mt-2">
          <MessageSquare size={48} className="text-[#6a6a75] mb-4" />
          <h3 className="text-xl font-bold text-[#e0e0ea] mb-1">No reviews found</h3>
          <p className="text-[#8a8a96] text-base">No reports match your current filters.</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-[#2a2a2f] rounded-xl overflow-hidden shadow-md mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0a0a0b] text-sm font-semibold tracking-wider text-[#b0b0ba] uppercase border-b border-[#2a2a2f]">
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4 text-center">Client Name</th>
                  <th className="px-6 py-4 text-center">Email</th>
                  <th className="px-6 py-4 text-center">Quest Room</th>
                  <th className="px-6 py-4 text-center">Rating</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2f]">
                {filteredReviews.map((review) => {
                  const isUnread = !review.isRead;
                  const hasReply = !!review.reply;

                  return (
                    <tr
                      key={review.id}
                      className={`transition-colors ${
                        isUnread ? "bg-zinc-800/30 hover:bg-zinc-800/50" : "hover:bg-[#1a1a1f]"
                      }`}
                    >
                      <td className={`px-6 py-4 text-center text-base ${isUnread ? "text-[#f0f0f5] font-bold" : "text-[#f0f0f5]"}`}>
                        {review.id}
                      </td>
                      <td className={`px-6 py-4 text-center text-base ${isUnread ? "text-[#e0e0ea] font-bold" : "text-[#e0e0ea] font-medium"}`}>
                        {review.user?.firstName} {review.user?.lastName}
                      </td>
                      <td className={`px-6 py-4 text-center text-base ${isUnread ? "text-[#e0e0ea] font-bold" : "text-[#e0e0ea] font-medium"}`}>
                        {review.user?.email}
                      </td>
                      <td className={`px-6 py-4 text-center text-base ${isUnread ? "text-[#e0e0ea] font-bold" : "text-[#e0e0ea] font-medium"}`}>
                        {review.escaperoom?.theme}
                      </td>
                      <td className={`px-6 py-4 text-center text-base ${isUnread ? "text-[#e0e0ea] font-bold" : "text-[#e0e0ea] font-medium"}`}>
                        {review.rating ? `${review.rating}/5` : "—/5"}
                      </td>
                      <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">{review.created_at}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleReadStatus(review.id, review.isRead)}
                            className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-zinc-500 text-[#b0b0ba] hover:text-[#d0d0da] transition-colors"
                            title={isUnread ? "Mark as Read" : "Mark as Unread"}
                          >
                            {isUnread ? <Check size={16} /> : <CheckCheck size={16} />}
                          </button>
                          <button
                            onClick={() => setSelectedReview(review)}
                            className={`p-2.5 bg-[#050505] border border-[#2a2a2f] rounded transition-colors ${
                              hasReply
                                ? "text-orange-500 hover:text-orange-400 hover:border-orange-500/50"
                                : "text-[#b0b0ba] hover:text-blue-400 hover:border-blue-500/50"
                            }`}
                            title={hasReply ? "View Reply" : "View & Reply"}
                          >
                            {hasReply
                              ? <CornerDownRight size={16} style={{ transform: "scaleY(-1)" }} />
                              : <MessageSquare size={16} />
                            }
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(review.id)}
                            className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-red-500/50 hover:text-red-400 text-[#b0b0ba] transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPLY MODAL ── */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewModal
            key={selectedReview.id}
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
            onSave={handleSaveReply}
            onDeleteReply={handleDeleteReply}
          />
        )}
      </AnimatePresence>

      {/* ── DELETE MODAL ── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center"
            >
              <div className="p-8 pb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-[#f0f0f5] mb-2">Delete Review?</h3>
                <p className="text-[#b0b0ba] text-base">
                  Are you sure you want to permanently delete review{" "}
                  <span className="text-[#f0f0f5] font-bold">ID: {deleteConfirmId}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="grid grid-cols-2 border-t border-[#2a2a2f] bg-[#0a0a0b]">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-4 font-semibold text-base text-[#b0b0ba] hover:text-white hover:bg-zinc-900 border-r border-[#2a2a2f] transition-colors"
                >
                  Keep It
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="py-4 font-semibold text-base text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SNACKBAR ── */}
      <AnimatePresence>
        {snackbar.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[70]"
          >
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManageReviews;
