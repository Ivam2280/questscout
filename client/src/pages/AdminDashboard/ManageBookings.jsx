import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_ALLBOOKINGS } from "../../utils/queries";
import { UPDATE_BOOKING } from "../../utils/mutations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Edit2, X, Check, CalendarDays,
  CheckCircle2, Hourglass, Ban, Filter, Flag, Calendar as CalendarIcon
} from "lucide-react";
import SnackBar from "../../components/SnackBarComponent/SnackBar";

const ManageBookings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editModalBooking, setEditModalBooking] = useState(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState("");

  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  const { loading, error, data, refetch } = useQuery(QUERY_ALLBOOKINGS, { fetchPolicy: "network-only" });
  const [updateBooking] = useMutation(UPDATE_BOOKING);

  const showSnack = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleEditClick = (booking) => {
    setEditModalBooking(booking);
    setEditPaymentStatus(booking.payment_status || "pending");
  };

  const handleCancelEdit = () => {
    setEditModalBooking(null);
    setEditPaymentStatus("");
  };

  const handleSaveEdit = async () => {
    try {
      if (editPaymentStatus === "cancelled") {
        await updateBooking({
          variables: {
            booking_id: editModalBooking.id,
            input: {
              payment_status: "cancelled",
              status: "cancelled"
            },
          },
        });
        showSnack("Booking cancelled successfully!");
      } else {
        await updateBooking({
          variables: {
            booking_id: editModalBooking.id,
            input: {
              payment_status: editPaymentStatus,
              status: "active"
            },
          },
        });
        showSnack("Booking status updated!");
      }
      setEditModalBooking(null);
      refetch();
    } catch (err) {
      console.error("Failed to update booking:", err);
      showSnack("Failed to update status. Try again.");
    }
  };

  const bookings = data?.getAllBookings || [];

  const displayedBookings = bookings.filter((booking) => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const duration = booking.escaperoom?.duration || 60;
    const endTime = new Date(bookingDateTime.getTime() + duration * 60000);
    const now = new Date();
    const isExpired = now > endTime;

    let derivedStatus = "pending";
    if (
      booking.status === "cancelled" ||
      booking.payment_status === "cancelled" ||
      (booking.payment_status === "pending" && isExpired)
    ) {
      derivedStatus = "cancelled";
    } else if (
      booking.status === "completed" ||
      (booking.payment_status === "completed" && isExpired)
    ) {
      derivedStatus = "finished";
    } else if (booking.payment_status === "completed" && !isExpired) {
      derivedStatus = "paid";
    } else {
      derivedStatus = "pending";
    }

    if (statusFilter !== "all" && derivedStatus !== statusFilter) return false;

    if (dateFilter && booking.date !== dateFilter) return false;

    const query = searchQuery.toLowerCase();
    if (query) {
      const roomTheme = booking.escaperoom?.theme?.toLowerCase() || "";
      const firstName = booking.user?.firstName?.toLowerCase() || "";
      const lastName = booking.user?.lastName?.toLowerCase() || "";
      const bookingId = booking.id.toString().toLowerCase();

      return (
        roomTheme.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        bookingId.includes(query)
      );
    }
    return true;
  });

  const getDerivedStatus = (booking) => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const duration = booking.escaperoom?.duration || 60;
    const endTime = new Date(bookingDateTime.getTime() + duration * 60000);
    const now = new Date();
    const isExpired = now > endTime;

    if (
      booking.status === "cancelled" ||
      booking.payment_status === "cancelled" ||
      (booking.payment_status === "pending" && isExpired)
    ) {
      return "cancelled";
    }
    if (
      booking.status === "completed" ||
      (booking.payment_status === "completed" && isExpired)
    ) {
      return "finished";
    }
    if (booking.payment_status === "completed" && !isExpired) return "paid";
    return "pending";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Paid
          </span>
        );
      case "finished":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Flag size={12} /> Finished
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
            <Ban size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Hourglass size={12} /> Pending
          </span>
        );
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e74c3c]"></div>
    </div>
  );
  if (error) return <div className="text-center text-red-500 mt-10">Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-6 font-['DM_Sans',sans-serif] pb-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 mb-2">

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col gap-1 shrink-0">
            <h1 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">Manage Bookings</h1>
            <p className="text-[#b0b0ba] text-base">Monitor and update client reservations.</p>
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

            <div className="relative w-full sm:w-48 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon size={18} className="text-[#8a8a96] group-focus-within:text-[#e74c3c] transition-colors" />
              </div>
              <input
                type="date"
                className="w-full bg-[#050505] border border-[#2a2a2f] text-[#e0e0ea] text-base rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-[#e74c3c]/50 focus:bg-[#1a1a1f] transition-all [color-scheme:dark]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button onClick={() => setDateFilter("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a96] hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

          </div>
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-1 bg-[#050505] p-1.5 rounded-lg border border-[#2a2a2f] w-full sm:w-auto overflow-x-auto">
            <Filter size={14} className="text-[#8a8a96] mx-2 shrink-0" />
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all shrink-0 ${
                statusFilter === "all" ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === "pending" ? "bg-yellow-500/10 text-yellow-500" : "text-[#8a8a96] hover:text-yellow-500"
              }`}
            >
              <Hourglass size={12} /> Pending
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === "paid" ? "bg-emerald-500/10 text-emerald-500" : "text-[#8a8a96] hover:text-emerald-500"
              }`}
            >
              <CheckCircle2 size={12} /> Paid
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === "cancelled" ? "bg-red-500/10 text-red-500" : "text-[#8a8a96] hover:text-red-500"
              }`}
            >
              <Ban size={12} /> Cancelled
            </button>
            <button
              onClick={() => setStatusFilter("finished")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === "finished" ? "bg-blue-500/10 text-blue-500" : "text-[#8a8a96] hover:text-blue-500"
              }`}
            >
              <Flag size={12} /> Finished
            </button>
          </div>
        </div>

      </div>

      {/* ── ТАБЛИЦЯ БРОНЮВАНЬ ── */}
      {displayedBookings.length > 0 ? (
        <div className="bg-[#111113] border border-[#2a2a2f] rounded-xl overflow-hidden shadow-md mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0a0a0b] text-sm font-semibold tracking-wider text-[#b0b0ba] uppercase border-b border-[#2a2a2f]">
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4 text-center">Quest Room</th>
                  <th className="px-6 py-4 text-center">Client</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2f]">
                {displayedBookings.map((booking) => {
                  const dateStr = new Date(booking.date).toLocaleDateString("en-GB");
                  const timeStr = booking.time.substring(0, 5);
                  const statusBadge = getDerivedStatus(booking);

                  return (
                    <tr key={booking.id} className="hover:bg-[#1a1a1f] transition-colors">
                      <td className="px-6 py-4 text-center text-base text-[#f0f0f5]">{booking.id}</td>
                      <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                        {booking.escaperoom?.theme}
                      </td>
                      <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </td>
                      <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                        {timeStr}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(statusBadge)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEditClick(booking)} className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-blue-500/50 hover:text-blue-400 text-[#b0b0ba] transition-colors" title="Edit Status">
                            <Edit2 size={16} />
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
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111113] border border-[#2a2a2f] rounded-xl border-dashed mt-2">
          <CalendarDays size={48} className="text-[#6a6a75] mb-4" />
          <h3 className="text-xl font-bold text-[#e0e0ea] mb-1">No bookings found</h3>
          <p className="text-[#8a8a96] text-base">No reservations match your current filters.</p>
        </div>
      )}

      {/* ── МОДАЛЬНЕ ВІКНО РЕДАГУВАННЯ СТАТУСУ ── */}
      <AnimatePresence>
        {editModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl w-full max-w-[605px] flex flex-col my-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2f]">
                <h2 className="text-xl font-bold text-[#f0f0f5]">Edit Booking Status</h2>
                <button onClick={handleCancelEdit} className="text-[#8a8a96] hover:text-white p-2 bg-[#050505] rounded border border-[#2a2a2f] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {/* ── КІМНАТА ТА КЛІЄНТ В ОДНОМУ РЯДКУ ── */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#0a0a0b] border border-[#2a2a2f] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#2a2a2f]">
                      <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Room</span>
                      <span className="text-sm text-[#8a8a96]">ID: {editModalBooking.escape_room_id}</span>
                    </div>
                    <div className="text-base text-[#e0e0ea] font-medium">{editModalBooking.escaperoom?.theme}</div>
                    <div className="text-sm text-[#8a8a96] mt-1.5">Price: {editModalBooking.escaperoom?.price}</div>
                  </div>
                  <div className="bg-[#0a0a0b] border border-[#2a2a2f] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#2a2a2f]">
                      <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Client</span>
                      <span className="text-sm text-[#8a8a96]">ID: {editModalBooking.user_id}</span>
                    </div>
                    <div className="text-base text-[#e0e0ea] font-medium">{editModalBooking.user?.firstName} {editModalBooking.user?.lastName}</div>
                    <div className="text-sm text-[#8a8a96] mt-1.5">{editModalBooking.user?.email}</div>
                  </div>
                </div>

                {/* ── ДЕТАЛІ БРОНЮВАННЯ ── */}
                <div className="bg-[#0a0a0b] border border-[#2a2a2f] rounded-lg p-5 mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#2a2a2f]">
                    <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Booking Details</span>
                    <span className="text-sm text-[#8a8a96]">ID: {editModalBooking.id}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#8a8a96]">Date</span>
                      <span className="text-sm text-[#e0e0ea] font-medium">{new Date(editModalBooking.date).toLocaleDateString("en-GB")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#8a8a96]">Time</span>
                      <span className="text-sm text-[#e0e0ea] font-medium">{editModalBooking.time.substring(0, 5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#8a8a96]">Players</span>
                      <span className="text-sm text-[#e0e0ea] font-medium">{editModalBooking.numberOfPlayers}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-[#2a2a2f]">
                      <span className="text-sm text-[#8a8a96]">Total Amount</span>
                      <span className="text-sm text-[#e0e0ea] font-medium">{editModalBooking.payment_amount || (editModalBooking.escaperoom?.price * editModalBooking.numberOfPlayers)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Select New Status</label>

                  <div className="flex bg-[#050505] border border-[#2a2a2f] rounded-lg p-1">
                    <button
                      onClick={() => setEditPaymentStatus("pending")}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        editPaymentStatus === "pending" ? "bg-yellow-500/10 text-yellow-500" : "text-[#8a8a96] hover:text-[#d0d0da]"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setEditPaymentStatus("completed")}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        editPaymentStatus === "completed" ? "bg-emerald-500/10 text-emerald-500" : "text-[#8a8a96] hover:text-[#d0d0da]"
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setEditPaymentStatus("cancelled")}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        editPaymentStatus === "cancelled" ? "bg-red-500/10 text-red-500" : "text-[#8a8a96] hover:text-[#d0d0da]"
                      }`}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                {(editPaymentStatus === "cancelled" || editPaymentStatus === "pending") && editModalBooking.payment_status === "completed" && editModalBooking.transaction_id && (
                  <div className="mt-4">
                    <p className="text-emerald-500/90 text-sm font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 leading-relaxed">
                      The client paid via PayPal. Changing the status to {editPaymentStatus === "cancelled" ? "Cancelled" : "Pending"} will automatically process a refund to their account.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[#2a2a2f] flex justify-end bg-[#0a0a0b] rounded-b-xl">
                <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-base bg-[#c0392b] hover:bg-[#e74c3c] text-white shadow-lg transition-colors border border-[#e74c3c]">
                  <Check size={16} /> Save Status
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {snackbar.show && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[70]">
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManageBookings;
