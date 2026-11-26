import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { QUERY_AllESCAPEROOMS } from "../../utils/queries";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import EscapeRoomCard from "../../components/EscapeRoomCardComponent/EscapeRoomCard";
import {
  FaFilter,
  FaSort,
  FaSearch,
  FaTimes,
  FaStar,
  FaSkull,
  FaChessKnight,
  FaChessPawn,
  FaUsers,
  FaMoneyBillWave,
  FaClock,
  FaChild,
  FaTheaterMasks,
  FaTrophy,
  FaChevronRight,
  FaUndo,
  FaEye,
} from "react-icons/fa";
import { GiSwordman } from "react-icons/gi";

/* ─────────────────────────────────────────
   DUAL-RANGE SLIDER
───────────────────────────────────────── */
const DualRangeSlider = ({ min, max, valueMin, valueMax, onChange, step = 100 }) => {
  const trackRef = useRef(null);
  const dragging = useRef(null);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const toPercent = (v) => ((v - min) / (max - min)) * 100;

  const posToValue = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return Math.round((min + ratio * (max - min)) / step) * step;
    },
    [min, max, step]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      const val = posToValue(e.clientX);
      if (dragging.current === "min") {
        onChange(clamp(val, min, valueMax - step), valueMax);
      } else {
        onChange(valueMin, clamp(val, valueMin + step, max));
      }
    },
    [dragging, posToValue, onChange, min, max, step, valueMin, valueMax]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const startDrag = (which) => (e) => {
    e.preventDefault();
    dragging.current = which;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const pMin = toPercent(valueMin);
  const pMax = toPercent(valueMax);

  return (
    <div className="px-2 py-3 select-none">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-bold text-[var(--white)] tracking-wider">{valueMin.toLocaleString()} ₴</span>
        <span className="text-xs font-bold text-[var(--white)] tracking-wider">{valueMax.toLocaleString()} ₴</span>
      </div>
      <div ref={trackRef} className="relative h-1 rounded-full bg-[var(--fog)] cursor-pointer">
        <div
          className="absolute h-full rounded-full bg-[var(--red)]"
          style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }}
        />
        <div
          onPointerDown={startDrag("min")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[var(--white)] border-2 border-[var(--red)] cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg z-10"
          style={{ left: `${pMin}%` }}
        />
        <div
          onPointerDown={startDrag("max")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[var(--white)] border-2 border-[var(--red)] cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg z-10"
          style={{ left: `${pMax}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--slate)] tracking-wider">{min.toLocaleString()}</span>
        <span className="text-[10px] text-[var(--slate)] tracking-wider">{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red: #c0392b; --red-hi: #e74c3c;
      --ink: #050505; --smoke: #111113; --ash: #1c1c1f;
      --fog: #2a2a2f; --slate: #8a8a96; --pale: #d6d6e0; --white: #f0f0f5;
      --border: rgba(255,255,255,0.07);
    }

    .qs-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink); color: var(--white);
      min-height: 100vh; overflow-x: hidden; position: relative;
    }
    .qs-display { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    .qs-page::before {
      content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    select option { background: var(--smoke); color: var(--white); }

    .filter-btn { position: relative; }
    .filter-dot {
      position: absolute; top: -4px; right: -4px;
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--red);
      box-shadow: 0 0 6px rgba(192,57,43,0.8);
    }

    .filter-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 4px;
      background: rgba(192,57,43,0.12);
      border: 1px solid rgba(192,57,43,0.35);
      font-size: 14px; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--white);
      white-space: nowrap;
    }
    .filter-chip button {
      display: flex; align-items: center; color: var(--slate);
      transition: color 0.2s;
    }
    .filter-chip button:hover { color: var(--red); }

    .player-stepper {
      display: flex; align-items: center; justify-content: center;
      gap: 0; background: rgba(255,255,255,0.02);
      border: 1px solid var(--border); border-radius: 6px;
      overflow: hidden;
      width: 100%;
    }
    .player-stepper button {
      width: 44px; height: 40px; display: flex; align-items: center;
      justify-content: center; font-size: 18px; font-weight: 300;
      color: var(--slate); transition: all 0.2s; flex-shrink: 0;
    }
    .player-stepper button:hover { background: rgba(192,57,43,0.1); color: var(--white); }
    .player-stepper button:active { background: rgba(192,57,43,0.2); }
    .player-stepper .stepper-val {
      flex: 1; text-align: center; font-size: 15px; font-weight: 600;
      letter-spacing: 0.05em; color: var(--white); padding: 0 4px;
      pointer-events: none; user-select: none;
    }

    .filter-section-label {
      font-size: 15px; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--pale); margin-bottom: 12px;
      display: flex; align-items: center; gap: 9px;
    }
    .filter-section-label svg {
      font-size: 14px;
    }

    .filter-opt-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 14px; border-radius: 4px; font-size: 13px;
      font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
      border: 1px solid var(--border); background: rgba(255,255,255,0.02);
      color: var(--slate); cursor: pointer; transition: all 0.2s;
      white-space: nowrap; width: 100%; min-width: 0;
    }
    .filter-opt-btn:hover { border-color: rgba(192,57,43,0.4); color: var(--white); }
    .filter-opt-btn.active {
      border-color: var(--red); background: rgba(192,57,43,0.12);
      color: var(--white);
      box-shadow: 0 0 8px rgba(192,57,43,0.15);
    }

    .sort-arrow {
      display: inline-block;
      transition: transform 0.3s ease;
      margin-left: auto;
      color: var(--white);
    }
    .sort-arrow.desc {
      transform: rotate(180deg);
    }

    .sort-btn-active {
      background: rgba(192, 57, 43, 0.12) !important;
      border-color: rgba(192, 57, 43, 0.45) !important;
      box-shadow: 0 0 12px rgba(192, 57, 43, 0.1) !important;
    }

    /* ── Стилі для бічної панелі фільтрів ── */
    .filter-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      z-index: 998; backdrop-filter: blur(2px);
    }

    .filter-sidebar {
      position: fixed; top: 0; right: 0; height: 100vh;
      width: 560px; max-width: 100vw; z-index: 999;
      background: var(--smoke); border-left: 1px solid var(--border);
      overflow: hidden; box-shadow: -10px 0 40px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
    }

    .filter-content {
      flex: 1; overflow-y: auto; padding: 24px 32px;
    }

    .filter-content::-webkit-scrollbar {
      width: 3px;
    }
    .filter-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .filter-content::-webkit-scrollbar-thumb {
      background: var(--fog); border-radius: 2px;
    }

    .filter-footer {
      border-top: 1px solid var(--border);
      padding: 18px 32px;
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      display: flex; gap: 10px;
    }

    /* Сітки для опцій фільтрів: кількість колонок підібрана так,
       щоб кількість елементів ділилась без залишку і всі ряди
       були однаковими за кількістю та шириною кнопок */
    .filter-grid-2 {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
    }

    .filter-grid-3 {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    }

    .filter-grid-4 {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }

    .filter-grid-5 {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    }
  `}</style>
);

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const PRICE_MIN = 0;
const PRICE_MAX = 5000;

// Жорстко задані списки всіх можливих параметрів фільтрації
const FULL_GENRES_LIST = [
  "Horror",
  "Detective",
  "Adventure",
  "Fantasy",
  "Crime",
  "Sci-Fi",
  "Historical",
  "Comedy"
]; // 8 елементів → сітка 4 колонки = 2 рівні ряди
const FULL_AGE_GROUPS_LIST = [6, 12, 16, 18]; // 4 елементи → сітка 4 колонки = 1 рівний ряд
const FULL_DURATIONS_LIST = [60, 90, 120]; // 3 елементи → сітка 3 колонки = 1 рівний ряд

// ── Анімація появи карток квестів (проста і швидка) ──
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const EscapeRoomsPage = () => {
  const [escapeRooms, setEscapeRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [genreFilter, setGenreFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [playersFilter, setPlayersFilter] = useState(0);
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [durationFilter, setDurationFilter] = useState("");

  const sidebarRef = useRef(null);
  const filterBtnRef = useRef(null);

  const { loading, data: allEscapeRoomsData } = useQuery(QUERY_AllESCAPEROOMS);

  // Використовуємо жорстко задані списки, щоб опції завжди були доступні
  const genres = FULL_GENRES_LIST;
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"]; // 4 елементи → сітка 2 колонки = 2 рівні ряди
  const difficultyIcons = {
    Beginner: <FaChessPawn className="mr-1" />,
    Intermediate: <FaChessKnight className="mr-1" />,
    Advanced: <GiSwordman className="mr-1" />,
    Expert: <FaSkull className="mr-1" />,
  };
  const ageGroups = FULL_AGE_GROUPS_LIST;
  const durations = FULL_DURATIONS_LIST;

  useEffect(() => { setIsMounted(true); }, []);

  // Блокування скролу body коли панель відкрита
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showFilters]);

  // Закриття по Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Клік поза панеллю для закриття
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  useEffect(() => {
    // Чекаємо, поки Apollo реально завершить запит (loading === false),
    // і тільки тоді записуємо дані та знімаємо isInitialLoad.
    // Це гарантує, що спінер не зникне раніше, ніж з'являться кімнати,
    // і "No missions found" більше не блимає на старті.
    if (loading) return;

    const rooms = allEscapeRoomsData?.getAllEscapeRooms || [];
    setEscapeRooms(rooms);
    setFilteredRooms(rooms);
    setIsInitialLoad(false);
  }, [loading, allEscapeRoomsData]);

  useEffect(() => {
    if (escapeRooms.length > 0 && !isInitialLoad) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        applyFilters();
        setIsLoading(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [
    genreFilter, difficultyFilter, ageGroupFilter, playersFilter,
    priceMin, priceMax, durationFilter, escapeRooms,
    sortOption, sortDirection, searchQuery, isInitialLoad,
  ]);

  const applyFilters = () => {
    let result = [...escapeRooms];

    // Пошук ТІЛЬКИ за назвою (theme)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => r.theme.toLowerCase().includes(q)
      );
    }
    if (genreFilter) result = result.filter((r) => r.genre === genreFilter);
    if (difficultyFilter) result = result.filter((r) => r.difficulty === difficultyFilter);
    if (ageGroupFilter) {
      const sel = parseInt(ageGroupFilter);
      result = result.filter((r) => { const a = parseInt(r.ageGroup); return !isNaN(a) && a <= sel; });
    }
    if (playersFilter > 0) {
      result = result.filter((r) => playersFilter >= r.playersMin && playersFilter <= r.playersMax);
    }
    if (priceMin > PRICE_MIN) result = result.filter((r) => r.price >= priceMin);
    if (priceMax < PRICE_MAX) result = result.filter((r) => r.price <= priceMax);
    if (durationFilter) {
      const d = parseInt(durationFilter, 10);
      result = result.filter((r) => r.duration === d);
    }
    if (sortOption) result = sortRooms(result);
    setFilteredRooms(result);
  };

  const sortRooms = (rooms) => {
    const s = [...rooms];
    const dir = sortDirection === "asc" ? 1 : -1;
    const difficultiesOrder = ["Beginner", "Intermediate", "Advanced", "Expert"];
    switch (sortOption) {
      case "rating":     s.sort((a, b) => ((a.averageRating || 0) - (b.averageRating || 0)) * dir); break;
      case "difficulty": s.sort((a, b) => (difficultiesOrder.indexOf(a.difficulty) - difficultiesOrder.indexOf(b.difficulty)) * dir); break;
      case "age":        s.sort((a, b) => (parseInt(a.ageGroup) - parseInt(b.ageGroup)) * dir); break;
      case "players":    s.sort((a, b) => (a.playersMax - b.playersMax) * dir); break;
      case "duration":   s.sort((a, b) => (a.duration - b.duration) * dir); break;
      case "price":      s.sort((a, b) => (a.price - b.price) * dir); break;
    }
    return s;
  };

  const resetFilters = () => {
    setGenreFilter(""); setDifficultyFilter(""); setAgeGroupFilter("");
    setPlayersFilter(0); setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX);
    setDurationFilter(""); setSearchQuery("");
    setFilteredRooms(escapeRooms);
  };

  const handleShowResults = () => {
    setShowFilters(false);
  };

  const handleSortOptionClick = (option) => {
    if (option === "none") {
      setSortOption(null);
      setSortDirection("asc");
      setShowSortDropdown(false);
    }
    else if (sortOption === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    }
    else {
      setSortOption(option);
      setSortDirection("asc");
    }
  };

  const hasActiveFilters =
    genreFilter || difficultyFilter || ageGroupFilter ||
    playersFilter > 0 || priceMin > PRICE_MIN || priceMax < PRICE_MAX || durationFilter;

  const activeChips = [
    genreFilter && { key: "genre", label: genreFilter, clear: () => setGenreFilter("") },
    difficultyFilter && { key: "diff", label: difficultyFilter, clear: () => setDifficultyFilter("") },
    ageGroupFilter && { key: "age", label: `${ageGroupFilter}+`, clear: () => setAgeGroupFilter("") },
    playersFilter > 0 && { key: "players", label: `${playersFilter} players`, clear: () => setPlayersFilter(0) },
    (priceMin > PRICE_MIN || priceMax < PRICE_MAX) && {
      key: "price",
      label: `${priceMin.toLocaleString()}–${priceMax.toLocaleString()} ₴`,
      clear: () => { setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX); },
    },
    durationFilter && { key: "dur", label: `${durationFilter} min`, clear: () => setDurationFilter("") },
  ].filter(Boolean);

  const getSortLabel = () => {
    const labels = {
      rating:     <><FaStar className="mr-2 text-[var(--red)]" /> Rating</>,
      difficulty: <><FaTrophy className="mr-2 text-[var(--red)]" /> Difficulty</>,
      age:        <><FaChild className="mr-2 text-[var(--red)]" /> Age</>,
      players:    <><FaUsers className="mr-2 text-[var(--red)]" /> Players</>,
      duration:   <><FaClock className="mr-2 text-[var(--red)]" /> Duration</>,
      price:      <><FaMoneyBillWave className="mr-2 text-[var(--red)]" /> Price</>,
    };
    if (!sortOption)
      return (
        <div className="flex items-center text-[var(--white)] font-bold tracking-wider uppercase text-sm">
          <FaSort className="mr-2 text-[var(--red)]" /> Sort By
        </div>
      );
    return (
      <div className="flex items-center text-[var(--white)] font-bold tracking-wider uppercase text-sm">
        {labels[sortOption]}
        <span className={`ml-2 transition-transform duration-300 ${sortDirection === "desc" ? "rotate-180" : "rotate-0"}`}>
          ↑
        </span>
      </div>
    );
  };

  return (
    <>
      <GlobalStyles />
      <div className="qs-page py-12 px-6 lg:px-12 relative z-10">
        <div className="max-w-[1400px] mx-auto">

          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6 border-b border-[var(--border)] pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25 }}
            >
              <p className="qs-condensed text-[var(--red)] text-sm tracking-[0.2em] uppercase font-bold mb-2">Available Missions</p>
              <h1 className="qs-display text-5xl md:text-6xl text-[var(--white)] uppercase leading-none">
                Quest <span style={{ color: "transparent", WebkitTextStroke: "2px var(--red)" }}>Rooms</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
            >
              {/* Search */}
              <div className="relative flex-grow group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <FaSearch className="text-[var(--slate)] group-focus-within:text-[var(--red)] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search missions..."
                  className="pl-11 pr-10 py-3 w-full sm:w-64 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded font-light text-sm text-[var(--white)] focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] outline-none transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <FaTimes className="text-[var(--slate)] hover:text-[var(--white)] transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {/* Filter button */}
                <div className="relative filter-btn" ref={filterBtnRef}>
                  {hasActiveFilters && <span className="filter-dot" />}
                  <button
                    onClick={() => setShowFilters(true)}
                    className={`flex items-center gap-2 px-6 py-3 border rounded font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
                      showFilters
                        ? "bg-[var(--red)] border-[var(--red)] text-white shadow-[0_0_15px_rgba(192,57,43,0.3)]"
                        : "bg-[rgba(255,255,255,0.02)] border-[var(--border)] text-[var(--white)] hover:border-[var(--red)]"
                    }`}
                  >
                    <FaFilter />
                    Filter
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown((v) => !v)}
                    className={`flex items-center gap-2 px-6 py-3 border rounded font-bold text-sm tracking-wider uppercase transition-all duration-300 ${
                      showSortDropdown || sortOption
                        ? "sort-btn-active bg-[rgba(255,255,255,0.02)] text-[var(--white)]"
                        : "bg-[rgba(255,255,255,0.02)] border-[var(--border)] text-[var(--white)] hover:border-[var(--red)]"
                    }`}
                  >
                    {getSortLabel()}
                  </button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSortDropdown(false);
                          }}
                        />

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-3 w-56 bg-[var(--smoke)] border border-[var(--fog)] shadow-2xl rounded z-50 overflow-hidden"
                        >
                          <div className="flex flex-col">
                            {[
                              { key: "none",       icon: <FaTimes className="mr-3 text-[var(--slate)]" />,       label: "No sorting" },
                              { key: "rating",     icon: <FaStar className="mr-3 text-[var(--red)]" />,          label: "Rating" },
                              { key: "difficulty", icon: <FaTrophy className="mr-3 text-[var(--red)]" />,        label: "Difficulty" },
                              { key: "age",        icon: <FaChild className="mr-3 text-[var(--red)]" />,         label: "Age" },
                              { key: "players",    icon: <FaUsers className="mr-3 text-[var(--red)]" />,         label: "Players" },
                              { key: "duration",   icon: <FaClock className="mr-3 text-[var(--red)]" />,         label: "Duration" },
                              { key: "price",      icon: <FaMoneyBillWave className="mr-3 text-[var(--red)]" />, label: "Price" },
                            ].map(({ key, icon, label }) => (
                              <button
                                key={key}
                                onClick={() => handleSortOptionClick(key)}
                                className={`flex items-center px-5 py-3 text-sm font-medium tracking-wide uppercase transition-colors ${
                                  (key === "none" && !sortOption) || sortOption === key
                                    ? "bg-[rgba(192,57,43,0.1)] text-white border-l-2 border-[var(--red)]"
                                    : "text-[var(--slate)] hover:bg-[rgba(255,255,255,0.03)] hover:text-white border-l-2 border-transparent"
                                }`}
                              >
                                {icon} {label}
                                {sortOption === key && key !== "none" && (
                                  <span className={`sort-arrow${sortDirection === "desc" ? " desc" : ""}`}>
                                    ↑
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── ACTIVE FILTER CHIPS ── */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-[var(--slate)] mr-1">Active:</span>
              {activeChips.map((chip) => (
                <span key={chip.key} className="filter-chip">
                  {chip.label}
                  <button onClick={chip.clear} aria-label={`Remove ${chip.label} filter`}>
                    <FaTimes size={13} />
                  </button>
                </span>
              ))}
              {activeChips.length > 1 && (
                <button
                  onClick={resetFilters}
                  className="text-sm font-bold tracking-widest uppercase text-[var(--slate)] hover:text-[var(--red)] transition-colors ml-1"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* ── ROOMS GRID ── */}
          <div className={`transition-opacity duration-300 ${isLoading ? "opacity-50" : "opacity-100"}`}>
            {filteredRooms.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      layout
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <EscapeRoomCard room={room} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : isInitialLoad || loading ? (
              // Поки триває перше завантаження даних — нічого не показуємо
              // (ні спінер, ні "No missions found"), щоб уникнути будь-якого
              // миготіння. Картки просто плавно з'являються, коли готові.
              <div aria-hidden="true" />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-[var(--border)] bg-[rgba(255,255,255,0.01)] rounded-lg text-center">
                <FaSearch className="text-5xl text-[var(--fog)] mb-4" />
                <h3 className="qs-condensed text-2xl text-[var(--white)] tracking-widest uppercase mb-2">No missions found</h3>
                <p className="text-[var(--slate)] font-light text-sm mb-6 max-w-md">
                  We couldn't find any quest rooms matching your current filters. Try adjusting your parameters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-8 py-3 bg-[var(--red)] text-white font-bold tracking-widest text-xs uppercase rounded transition-colors hover:bg-[var(--red-hi)]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── FILTER SIDEBAR OVERLAY ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Overlay */}
            <motion.div
              key="filter-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="filter-overlay"
              onClick={() => setShowFilters(false)}
            />

            {/* Sidebar */}
            <motion.div
              key="filter-sidebar"
              ref={sidebarRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="filter-sidebar"
            >
              {/* Компактний симетричний header */}
              <div className="flex items-center justify-between px-8 py-4 border-b border-[var(--border)] bg-[rgba(0,0,0,0.3)] flex-shrink-0">
                <h2 className="qs-condensed text-xl font-bold tracking-wider uppercase text-[var(--pale)] flex items-center gap-2">
                  <FaFilter className="text-[var(--red)] text-sm" /> Filters
                </h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--slate)] hover:text-[var(--white)] hover:bg-[rgba(255,255,255,0.05)] rounded transition-all"
                >
                  <FaChevronRight size={15} />
                </button>
              </div>

              {/* Скролований контент - розтягнутий */}
              <div className="filter-content">
                <div className="flex flex-col gap-7 h-full">
                  {/* Genre — 8 елементів, 4 колонки = 2 рівні ряди */}
                  <div>
                    <p className="filter-section-label">
                      <FaTheaterMasks className="text-[var(--red)] text-xs" /> Genre
                    </p>
                    <div className="filter-grid-4">
                      {genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => setGenreFilter(genreFilter === g ? "" : g)}
                          className={`filter-opt-btn ${genreFilter === g ? "active" : ""}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty — 4 елементи, 2 колонки = 2 рівні ряди */}
                  <div>
                    <p className="filter-section-label">
                      <FaTrophy className="text-[var(--red)] text-xs" /> Difficulty
                    </p>
                    <div className="filter-grid-2">
                      {difficulties.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficultyFilter(difficultyFilter === d ? "" : d)}
                          className={`filter-opt-btn inline-flex items-center justify-center ${difficultyFilter === d ? "active" : ""}`}
                        >
                          {difficultyIcons[d]}{d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age — 4 елементи, 4 колонки = 1 рівний ряд */}
                  <div>
                    <p className="filter-section-label">
                      <FaChild className="text-[var(--red)] text-xs" /> Age Group
                    </p>
                    <div className="filter-grid-4">
                      {ageGroups.map((a) => (
                        <button
                          key={a}
                          onClick={() => setAgeGroupFilter(ageGroupFilter === String(a) ? "" : String(a))}
                          className={`filter-opt-btn ${ageGroupFilter === String(a) ? "active" : ""}`}
                        >
                          {a}+
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration — 3 елементи, 3 колонки = 1 рівний ряд */}
                  <div>
                    <p className="filter-section-label">
                      <FaClock className="text-[var(--red)] text-xs" /> Duration
                    </p>
                    <div className="filter-grid-3">
                      {durations.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDurationFilter(durationFilter === String(d) ? "" : String(d))}
                          className={`filter-opt-btn ${durationFilter === String(d) ? "active" : ""}`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Players */}
                  <div>
                    <p className="filter-section-label">
                      <FaUsers className="text-[var(--red)] text-xs" /> Players
                    </p>
                    <div className="player-stepper">
                      <button onClick={() => setPlayersFilter((v) => Math.max(0, v - 1))} aria-label="Decrease">−</button>
                      <span className="stepper-val">{playersFilter === 0 ? "Any" : playersFilter}</span>
                      <button onClick={() => setPlayersFilter((v) => v + 1)} aria-label="Increase">+</button>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="filter-section-label">
                      <FaMoneyBillWave className="text-[var(--red)] text-xs" /> Price Range
                    </p>
                    <DualRangeSlider
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      valueMin={priceMin}
                      valueMax={priceMax}
                      onChange={(lo, hi) => { setPriceMin(lo); setPriceMax(hi); }}
                      step={100}
                    />
                  </div>
                </div>
              </div>

              {/* Футер з двома кнопками */}
              <div className="filter-footer flex-shrink-0">
                <button
                  onClick={resetFilters}
                  className="px-4 py-3 bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)] text-[var(--white)] font-bold tracking-widest text-xs uppercase rounded transition-all hover:bg-[var(--red)] hover:border-[var(--red)] flex items-center justify-center gap-2 group flex-shrink-0"
                  style={{ flex: "0 0 35%" }}
                >
                  <FaUndo className="text-[var(--red)] group-hover:text-white transition-colors" size={12} />
                  Reset
                </button>

                <button
                  onClick={handleShowResults}
                  className="px-6 py-3 bg-[var(--red)] border border-[var(--red)] text-white font-bold tracking-widest text-xs uppercase rounded transition-all hover:bg-[var(--red-hi)] hover:border-[var(--red-hi)] flex items-center justify-center gap-2 shadow-lg shadow-[rgba(192,57,43,0.3)]"
                  style={{ flex: "1 1 65%" }}
                >
                  <FaEye size={13} />
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollToTop(EscapeRoomsPage);
