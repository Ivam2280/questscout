import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { QUERY_ALLUSERS, ME_QUERY } from "../../utils/queries";
import { DELETE_USER, TOGGLE_BLOCK_USER } from "../../utils/mutations";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Users, Ban, Unlock, Lock, BarChart2, X, CheckCircle2 } from "lucide-react";
import SnackBar from "../../components/SnackBarComponent/SnackBar";

const ManageUsers = () => {
  // ─── СТАНИ ───
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [blockConfirmUser, setBlockConfirmUser] = useState(null);
  const [statsModalUser, setStatsModalUser] = useState(null);

  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ─── GRAPHQL ───
  const { loading, error, data } = useQuery(QUERY_ALLUSERS, { fetchPolicy: "network-only" });
  const { data: meData } = useQuery(ME_QUERY);

  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: QUERY_ALLUSERS }],
  });

  const [toggleBlockUser] = useMutation(TOGGLE_BLOCK_USER, {
    refetchQueries: [{ query: QUERY_ALLUSERS }],
  });

  const showSnack = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  // ─── ОБРОБКА ДІЙ ───
  const handleDeleteConfirm = async () => {
    try {
      await deleteUser({ variables: { id: deleteConfirmId } });
      showSnack("User deleted successfully!");
    } catch (err) {
      console.error("Failed to delete user:", err);
      showSnack("Failed to delete user. Please try again.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleToggleBlockConfirm = async () => {
    if (!blockConfirmUser) return;
    try {
      await toggleBlockUser({ variables: { id: blockConfirmUser.id } });
      showSnack(blockConfirmUser.isBlocked ? "User has been unblocked!" : "User has been blocked!");
    } catch (err) {
      console.error("Failed to toggle block:", err);
      showSnack("Failed to update user status.");
    } finally {
      setBlockConfirmUser(null);
    }
  };

  // ─── ФІЛЬТРАЦІЯ ───
  const users = data?.getAllUsers || [];

  const filteredUsers = users.filter((user) => {
    if (user.isAdmin) return false;

    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
  });

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e74c3c]"></div>
    </div>
  );

  if (error) return <div className="text-center text-red-500 mt-10">Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-6 font-['DM_Sans',sans-serif] pb-10">

      {/* ── HEADER ТА ПАНЕЛЬ ІНСТРУМЕНТІВ ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-2">

        <div className="flex flex-col gap-1 shrink-0">
          <h1 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">Manage Users</h1>
          <p className="text-[#b0b0ba] text-base">View and manage system access and client statistics.</p>
        </div>

        <div className="flex items-center w-full xl:w-auto justify-end">
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
        </div>
      </div>

      {/* ── ТАБЛИЦЯ КОРИСТУВАЧІВ ── */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111113] border border-[#2a2a2f] rounded-xl border-dashed mt-2">
          <Users size={48} className="text-[#6a6a75] mb-4" />
          <h3 className="text-xl font-bold text-[#e0e0ea] mb-1">No users found</h3>
          <p className="text-[#8a8a96] text-base">No accounts match your current search.</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-[#2a2a2f] rounded-xl overflow-hidden shadow-md mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0a0a0b] text-sm font-semibold tracking-wider text-[#b0b0ba] uppercase border-b border-[#2a2a2f]">
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4 text-center">Name</th>
                  <th className="px-6 py-4 text-center">Email</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2f]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a1a1f] transition-colors">
                    <td className="px-6 py-4 text-center text-base text-[#f0f0f5]">{user.id}</td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                            <Ban size={12} /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setStatsModalUser(user)}
                          className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-blue-500/50 hover:text-blue-400 text-[#b0b0ba] transition-colors"
                          title="Client Statistics"
                        >
                          <BarChart2 size={16} />
                        </button>

                        <button
                          onClick={() => setBlockConfirmUser(user)}
                          className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-orange-500/50 hover:text-orange-400 text-[#b0b0ba] transition-colors"
                          title={user.isBlocked ? "Unblock User" : "Block User"}
                        >
                          {user.isBlocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-red-500/50 hover:text-red-400 text-[#b0b0ba] transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── СТАТИСТИКА КОРИСТУВАЧА ── */}
      <AnimatePresence>
        {statsModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl w-full max-w-md flex flex-col my-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2f]">
                <div>
                  <h2 className="text-xl font-bold text-[#f0f0f5] mb-1">
                    Client Statistics
                  </h2>
                  <p className="text-lg text-[#e0e0ea] font-medium">
                    {statsModalUser.firstName} {statsModalUser.lastName}
                  </p>
                </div>
                <button onClick={() => setStatsModalUser(null)} className="text-[#8a8a96] hover:text-white p-2 bg-[#050505] rounded border border-[#2a2a2f] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 flex flex-col gap-8">
                <div className="flex justify-between items-end border-b border-[#2a2a2f] pb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Total Spent</span>
                    <span className="text-4xl font-light text-[#f0f0f5]">
                      {statsModalUser.stats?.totalSpent || 0} <span className="text-sm text-[#8a8a96] font-medium">UAH</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Bookings</span>
                    <span className="text-2xl font-light text-[#e0e0ea]">{statsModalUser.stats?.totalBookings || 0}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Completed</span>
                    <span className="text-2xl font-light text-emerald-400">{statsModalUser.stats?.completedBookings || 0}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#b0b0ba] uppercase tracking-wider">Reviews</span>
                    <span className="text-2xl font-light text-purple-400">{statsModalUser.stats?.totalReviews || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ЦЕНТРАЛЬНА МОДАЛКА: ПІДТВЕРДЖЕННЯ БЛОКУВАННЯ ── */}
      <AnimatePresence>
        {blockConfirmUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center"
            >
              <div className="p-8 pb-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                  {blockConfirmUser.isBlocked ? (
                    <Unlock size={28} className="text-orange-500" />
                  ) : (
                    <Lock size={28} className="text-orange-500" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#f0f0f5] mb-2">
                  {blockConfirmUser.isBlocked ? "Unblock User?" : "Block User?"}
                </h3>
                <p className="text-[#b0b0ba] text-base">
                  Are you sure you want to {blockConfirmUser.isBlocked ? "unblock" : "block"} user <span className="text-[#f0f0f5] font-bold">ID: {blockConfirmUser.id}</span>?
                </p>
              </div>
              <div className="grid grid-cols-2 border-t border-[#2a2a2f] bg-[#0a0a0b]">
                <button onClick={() => setBlockConfirmUser(null)} className="py-4 font-semibold text-base text-[#b0b0ba] hover:text-white hover:bg-zinc-900 border-r border-[#2a2a2f] transition-colors">
                  Cancel
                </button>
                <button onClick={handleToggleBlockConfirm} className="py-4 font-semibold text-base text-orange-500 hover:bg-orange-500/10 transition-colors">
                  Yes, {blockConfirmUser.isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ЦЕНТРАЛЬНА МОДАЛКА: ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ── */}
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
                <h3 className="text-2xl font-bold text-[#f0f0f5] mb-2">Delete User?</h3>
                <p className="text-[#b0b0ba] text-base">
                  Are you sure you want to permanently delete user account <span className="text-[#f0f0f5] font-bold">ID: {deleteConfirmId}</span>? This action cannot be undone and will remove all their data.
                </p>
              </div>
              <div className="grid grid-cols-2 border-t border-[#2a2a2f] bg-[#0a0a0b]">
                <button onClick={() => setDeleteConfirmId(null)} className="py-4 font-semibold text-base text-[#b0b0ba] hover:text-white hover:bg-zinc-900 border-r border-[#2a2a2f] transition-colors">
                  Keep It
                </button>
                <button onClick={handleDeleteConfirm} className="py-4 font-semibold text-base text-red-500 hover:bg-red-500/10 transition-colors">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[70]">
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManageUsers;
