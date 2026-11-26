import { prepareImage } from "../../utils/images";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_AllESCAPEROOMS } from "../../utils/queries";
import { CREATE_ESCAPEROOM, UPDATE_ESCAPEROOM, DELETE_ESCAPEROOM } from "../../utils/mutations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Grid as GridIcon, List as ListIcon, Plus,
  Edit2, Trash2, X, UploadCloud, DoorOpen,
  AlertCircle
} from "lucide-react";
import {
  FaTheaterMasks,
  FaTrophy,
  FaUserFriends,
  FaMoneyBillWave,
  FaClock,
  FaChild
} from "react-icons/fa";
import SnackBar from "../../components/SnackBarComponent/SnackBar";

const DEFAULT_FORM_STATE = {
  theme: "",
  genre: "",
  difficulty: "",
  ageGroup: "",
  playersMin: "",
  playersMax: "",
  price: "",
  description: "",
  duration: "",
  image_url: "",
  gallery: [],
};

const ManageRooms = () => {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("adminRoomsViewMode") || "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const themeInputRef = useRef(null);
  const imageUploadDivRef = useRef(null);
  const descriptionInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("adminRoomsViewMode", viewMode);
  }, [viewMode]);

  const { loading, error, data, refetch } = useQuery(QUERY_AllESCAPEROOMS, { fetchPolicy: "network-only" });
  const [createRoom] = useMutation(CREATE_ESCAPEROOM);
  const [updateRoom] = useMutation(UPDATE_ESCAPEROOM);
  const [deleteRoom] = useMutation(DELETE_ESCAPEROOM);

  const showSnack = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleOpenModal = (room = null) => {
    setFormError("");
    if (room) {
      setEditingId(room.id);
      setFormData({
        theme: room.theme || "",
        genre: room.genre || "",
        difficulty: room.difficulty || "",
        ageGroup: room.ageGroup || "",
        playersMin: room.playersMin || "",
        playersMax: room.playersMax || "",
        price: room.price || "",
        description: room.description || "",
        duration: room.duration || "",
        image_url: room.image_url || "",
        gallery: room.gallery || [],
      });
    } else {
      setEditingId(null);
      setFormData(DEFAULT_FORM_STATE);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_STATE);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const image = await prepareImage(file);
      setFormData((previous) => ({ ...previous, image_url: image }));
      setFormError("");
    } catch (error) { setFormError(error.message); }
    e.target.value = "";
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (formData.gallery.length + files.length > 6) { setFormError("Use up to six gallery images."); return; }
    try {
      const images = await Promise.all(files.map(prepareImage));
      setFormData((previous) => ({ ...previous, gallery: [...previous.gallery, ...images] }));
      setFormError("");
    } catch (error) { setFormError(error.message); }
    e.target.value = "";
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const validateAndFocus = () => {
    if (!formData.image_url) {
      setFormError("Main image is required.");
      imageUploadDivRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!formData.theme) {
      setFormError("Quest name is required.");
      themeInputRef.current?.focus();
      themeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!formData.genre) {
      setFormError("Genre is required.");
      return false;
    }
    if (!formData.difficulty) {
      setFormError("Difficulty is required.");
      return false;
    }
    if (!formData.ageGroup) {
      setFormError("Age group is required.");
      return false;
    }
    if (!formData.duration) {
      setFormError("Duration is required.");
      return false;
    }
    if (!formData.playersMin) {
      setFormError("Minimum players is required.");
      return false;
    }
    if (!formData.playersMax) {
      setFormError("Maximum players is required.");
      return false;
    }
    if (parseInt(formData.playersMin) > parseInt(formData.playersMax)) {
      setFormError("Minimum players cannot exceed maximum players.");
      return false;
    }
    if (!formData.price) {
      setFormError("Price is required.");
      return false;
    }
    if (!formData.description) {
      setFormError("Description is required.");
      descriptionInputRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAndFocus()) return;

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      playersMin: parseInt(formData.playersMin),
      playersMax: parseInt(formData.playersMax),
      duration: parseInt(formData.duration),
    };

    try {
      if (editingId) {
        await updateRoom({ variables: { id: editingId, input: payload } });
        showSnack("Room updated successfully!");
      } else {
        await createRoom({ variables: { input: payload } });
        showSnack("Room created successfully!");
      }
      refetch();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Failed to save room.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRoom({ variables: { id: deleteConfirmId } });
      showSnack("Room deleted successfully!");
      refetch();
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete room.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const rooms = data?.getAllEscapeRooms || [];
  const filteredRooms = rooms.filter(room => {
    const query = searchQuery.toLowerCase();
    return (
      room.theme.toLowerCase().includes(query) ||
      room.genre.toLowerCase().includes(query) ||
      room.id.toString().includes(query)
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">

        <div className="flex flex-col gap-1 shrink-0">
          <h1 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">Manage Rooms</h1>
          <p className="text-[#b0b0ba] text-base">Create, update, and remove quest rooms from the catalog.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">

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

          <button
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none w-full sm:w-auto flex items-center justify-center gap-2 bg-[#050505] border border-[#2a2a2f] hover:border-[#e74c3c]/50 hover:text-[#e74c3c] text-[#d0d0da] px-4 py-2.5 rounded-lg font-semibold text-base transition-colors"
          >
            <Plus size={18} /> Add Room
          </button>

          <div className="flex items-center bg-[#050505] border border-[#2a2a2f] rounded-lg p-1 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"}`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"}`}
              title="Grid View"
            >
              <GridIcon size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* ── СПИСОК КІМНАТ ── */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111113] border border-[#2a2a2f] rounded-xl border-dashed mt-4">
          <DoorOpen size={48} className="text-[#6a6a75] mb-4" />
          <h3 className="text-xl font-bold text-[#e0e0ea] mb-1">No rooms found</h3>
          <p className="text-[#8a8a96] text-base">Adjust your search query or add a new room.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* РЕЖИМ СІТКИ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-[#111113] border border-[#2a2a2f] rounded-xl overflow-hidden hover:border-[#3e3e45] transition-all shadow-md flex flex-col group">

              {/* Зображення */}
              <div className="h-44 relative bg-black border-b border-[#2a2a2f]">
                <img src={room.image_url} alt={room.theme} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                {/* ID Badge */}
                <div className="absolute top-3 left-3 bg-[#0a0a0b]/80 backdrop-blur-sm border border-[#2a2a2f] px-3 py-1.5 rounded text-sm font-bold text-[#f0f0f5] tracking-wider">
                  ID: {room.id}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                {/* Назва */}
                <h3 className="text-xl font-bold text-[#f0f0f5] mb-3 line-clamp-1">{room.theme}</h3>

                {/* Параметри */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 mt-auto">
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaTheaterMasks size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="truncate font-medium text-[#e0e0ea]" title={room.genre}>{room.genre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaTrophy size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="truncate font-medium text-[#e0e0ea]">{room.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaChild size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="font-medium text-[#e0e0ea]">{room.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaClock size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="font-medium text-[#e0e0ea]">{room.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaUserFriends size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="font-medium text-[#e0e0ea]">{room.playersMin}-{room.playersMax} P</span>
                  </div>
                  <div className="flex items-center gap-2 text-base text-[#c0c0ca]">
                    <FaMoneyBillWave size={16} className="text-[#e74c3c] shrink-0" />
                    <span className="font-medium text-[#e0e0ea]">{room.price} ₴</span>
                  </div>
                </div>

                {/* Кнопки дій */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#2a2a2f] pt-3">
                  <button onClick={() => handleOpenModal(room)} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#050505] border border-[#2a2a2f] hover:border-blue-500/50 hover:text-blue-400 text-[#b0b0ba] transition-colors text-xs font-bold uppercase tracking-widest">
                    <Edit2 size={15} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirmId(room.id)} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#050505] border border-[#2a2a2f] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-[#b0b0ba] transition-colors text-xs font-bold uppercase tracking-widest">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* РЕЖИМ СПИСКУ (ТАБЛИЦЯ) */
        <div className="bg-[#111113] border border-[#2a2a2f] rounded-xl overflow-hidden shadow-md mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0a0a0b] text-sm font-semibold tracking-wider text-[#b0b0ba] uppercase border-b border-[#2a2a2f]">
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4 text-center">Name</th>
                  <th className="px-6 py-4 text-center">Photo</th>
                  <th className="px-6 py-4 text-center">Genre</th>
                  <th className="px-6 py-4 text-center">Difficulty</th>
                  <th className="px-6 py-4 text-center">Players</th>
                  <th className="px-6 py-4 text-center">Duration</th>
                  <th className="px-6 py-4 text-center">Price</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2f]">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-[#1a1a1f] transition-colors">
                    <td className="px-6 py-4 text-center text-base text-[#f0f0f5]">{room.id}</td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">{room.theme}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <img src={room.image_url} alt="" className="w-12 h-12 rounded object-cover border border-zinc-800 opacity-80" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">{room.genre}</td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">{room.difficulty}</td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                      {room.playersMin}-{room.playersMax}
                    </td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                      {room.duration}
                    </td>
                    <td className="px-6 py-4 text-center text-base text-[#e0e0ea] font-medium">
                      {room.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(room)} className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-blue-500/50 hover:text-blue-400 text-[#b0b0ba] transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(room.id)} className="p-2.5 bg-[#050505] border border-[#2a2a2f] rounded hover:border-red-500/50 hover:text-red-400 text-[#b0b0ba] transition-colors" title="Delete">
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

      {/* ── ЦЕНТРАЛЬНА МОДАЛКА: СТВОРЕННЯ/РЕДАГУВАННЯ ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111113] border border-[#2a2a2f] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col my-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2f] shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-[#f0f0f5]">
                    {editingId ? "Edit Quest Room" : "Add New Quest Room"}
                  </h2>
                  {editingId && (
                    <p className="text-base text-[#8a8a96] mt-1">Editing room ID: {editingId}</p>
                  )}
                </div>
                <button onClick={handleCloseModal} className="text-[#8a8a96] hover:text-white p-2 bg-[#050505] rounded border border-[#2a2a2f] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="room-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Завантаження головного зображення */}
                  <div ref={imageUploadDivRef}>
                    <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Main Cover Image</label>
                    <div
                      className={`border-2 border-dashed rounded-lg bg-[#050505] p-6 text-center hover:border-[#e74c3c]/50 transition-colors cursor-pointer group relative overflow-hidden h-48 flex items-center justify-center ${!formData.image_url && formError === "Main image is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.image_url ? (
                        <>
                          <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                          <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                            <UploadCloud size={32} className="text-white mb-2" />
                            <span className="text-base font-bold text-white">Click to change image</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-[#8a8a96] group-hover:text-[#e74c3c] transition-colors">
                          <UploadCloud size={32} className="mb-3" />
                          <span className="text-base font-medium">Click to upload main image</span>
                          <span className="text-sm mt-1 opacity-70">JPEG, PNG or WebP · up to 10 MB</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    </div>
                  </div>

                  {/* Додаткові зображення (Галерея) */}
                  <div>
                    <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Gallery Images</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {formData.gallery.map((img, i) => (
                        <div key={i} className="relative h-24 bg-black rounded-lg overflow-hidden border border-[#2a2a2f] group">
                          <img src={img} alt="" className="w-full h-full object-cover opacity-80" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <div
                        onClick={() => galleryInputRef.current?.click()}
                        className="h-24 border-2 border-dashed border-[#2a2a2f] rounded-lg bg-[#050505] flex flex-col items-center justify-center cursor-pointer hover:border-[#e74c3c]/50 transition-colors text-[#8a8a96] hover:text-[#e74c3c]"
                      >
                        <Plus size={24} />
                        <span className="text-xs mt-1 font-medium">Add Image</span>
                        <input type="file" multiple accept="image/jpeg,image/png,image/webp" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Quest Name</label>
                      <input
                        ref={themeInputRef}
                        type="text"
                        name="theme"
                        required
                        maxLength={25}
                        value={formData.theme}
                        onChange={handleInputChange}
                        className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none placeholder:text-[#6a6a75] ${!formData.theme && formError === "Quest name is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`}
                        placeholder="Enter quest name"
                      />
                      <p className="text-right text-xs text-[#6a6a75] mt-1">{formData.theme.length}/25</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Genre</label>
                      <select name="genre" value={formData.genre} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none appearance-none ${!formData.genre && formError === "Genre is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} required>
                        <option value="">Select genre</option>
                        <option value="Horror">Horror</option>
                        <option value="Detective">Detective</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Fantasy">Fantasy</option>
                        <option value="Crime">Crime</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Historical">Historical</option>
                        <option value="Comedy">Comedy</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Difficulty</label>
                      <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none appearance-none ${!formData.difficulty && formError === "Difficulty is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} required>
                        <option value="">Select difficulty</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Age Group</label>
                      <select name="ageGroup" value={formData.ageGroup} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none appearance-none ${!formData.ageGroup && formError === "Age group is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} required>
                        <option value="">Select age group</option>
                        <option value="6+">6+</option>
                        <option value="12+">12+</option>
                        <option value="16+">16+</option>
                        <option value="18+">18+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Duration</label>
                      <select name="duration" value={formData.duration} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none appearance-none ${!formData.duration && formError === "Duration is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} required>
                        <option value="">Select duration</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                        <option value="120">120 min</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Min Players</label>
                      <input type="number" name="playersMin" min="1" max="10" required value={formData.playersMin} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none placeholder:text-[#6a6a75] ${!formData.playersMin && formError === "Minimum players is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} placeholder="Min" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Max Players</label>
                      <input type="number" name="playersMax" min="1" max="10" required value={formData.playersMax} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-2.5 focus:border-[#e74c3c] focus:outline-none placeholder:text-[#6a6a75] ${!formData.playersMax && formError === "Maximum players is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} placeholder="Max" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Price</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaMoneyBillWave size={16} className="text-[#e74c3c]" />
                        </div>
                        <input type="number" name="price" min="0" step="1" required value={formData.price} onChange={handleInputChange} className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg pl-10 pr-4 py-2.5 focus:border-[#e74c3c] focus:outline-none placeholder:text-[#6a6a75] ${!formData.price && formError === "Price is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`} placeholder="0" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#b0b0ba] uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      ref={descriptionInputRef}
                      name="description"
                      required
                      maxLength={1000}
                      rows="5"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full bg-[#050505] border text-[#f0f0f5] text-base rounded-lg px-4 py-3 focus:border-[#e74c3c] focus:outline-none resize-none placeholder:text-[#6a6a75] ${!formData.description && formError === "Description is required." ? "border-red-500/50" : "border-[#2a2a2f]"}`}
                      placeholder="Enter full mission briefing here..."
                    />
                    <p className="text-right text-xs text-[#6a6a75] mt-1">{formData.description.length}/1000</p>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-[#2a2a2f] shrink-0 bg-[#0a0a0b] rounded-b-xl">
                {formError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{formError}</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <button type="submit" form="room-form" className="px-6 py-2.5 rounded-lg font-semibold text-base bg-[#c0392b] hover:bg-[#e74c3c] text-white shadow-lg transition-colors border border-[#e74c3c]">
                    {editingId ? "Save Changes" : "Publish Room"}
                  </button>
                </div>
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
                <h3 className="text-2xl font-bold text-[#f0f0f5] mb-2">Delete Room?</h3>
                <p className="text-[#b0b0ba] text-base">
                  Are you sure you want to permanently delete room <span className="text-[#f0f0f5] font-bold">ID: {deleteConfirmId}</span>? This action cannot be undone.
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

      {/* Снекбар */}
      <AnimatePresence>
        {snackbar.show && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[70]">
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050505;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2f;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3e3e45;
        }
      `}</style>
    </div>
  );
};

export default ManageRooms;
