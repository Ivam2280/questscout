import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  QUERY_ALLBOOKINGS,
  QUERY_ALLUSERS,
  QUERY_AllESCAPEROOMS,
} from "../../utils/queries";
import {
  Users,
  DoorOpen,
  CalendarDays,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-[#111113] border border-[#2a2a2f] p-5 rounded-2xl flex items-center gap-5 hover:bg-[#151518] hover:border-[#3e3e45] transition-all duration-300 shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-8 -top-8 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full ${colorClass.split(" ")[0]}`} />
    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${colorClass}`}>
      <Icon size={20} />
    </div>
    <div className="flex flex-col">
      <p className="text-sm font-bold tracking-wider text-[#b0b0ba] uppercase mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-[#f0f0f5] leading-none tracking-wide">
        {value}
      </p>
    </div>
  </div>
);

// Максимум символів в одному рядку підпису осі Y, перш ніж переносити слово далі
const Y_AXIS_LINE_MAX_CHARS = 19;
// Максимальна кількість рядків для назви (довші назви обрізаються тільки на 3-му рядку)
const Y_AXIS_MAX_LINES = 2;

// Розбиває назву на рядки по словах (word-wrap), не обрізаючи текст,
// якщо він фізично вміщується у 2 рядки. Обрізає з "…" лише якщо
// назва настільки довга, що не влазить навіть у 2 рядки.
const wrapName = (name, maxLineChars = Y_AXIS_LINE_MAX_CHARS, maxLines = Y_AXIS_MAX_LINES) => {
  if (!name) return [""];

  const words = name.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLineChars) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      // Якщо саме слово довше за рядок — рубаємо його примусово
      currentLine = word.length > maxLineChars ? word.slice(0, maxLineChars) : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const lastIdx = maxLines - 1;
    const lastLine = kept[lastIdx];
    kept[lastIdx] =
      lastLine.length > maxLineChars - 1
        ? `${lastLine.slice(0, maxLineChars - 1)}…`
        : `${lastLine}…`;
    return kept;
  }

  return lines;
};

const CustomYAxisTick = (props) => {
  const { x, y, payload } = props;
  const parts = payload.value.split("|");
  const name = parts[0]?.trim() || "";
  const lines = wrapName(name);

  const LINE_HEIGHT = 17;
  // Один рядок центрується на осі (y=4).
  // Два рядки розташовуються симетрично навколо центру.
  const nameYPositions =
    lines.length === 1
      ? [4]
      : Array.from({ length: lines.length }, (_, i) => 4 - ((lines.length - 1) / 2 - i) * LINE_HEIGHT);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Нативний tooltip з повною назвою при наведенні (корисно навіть коли не обрізано) */}
      <title>{name}</title>
      {lines.map((line, i) => (
        <text
          key={i}
          x={-8}
          y={nameYPositions[i]}
          textAnchor="end"
          fill="#e0e0ea"
          fontSize={16.1}
          fontWeight={400}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Кастомний тултіп для Top Quest Rooms
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const parts = payload[0].payload.name.split("|");
    const roomName = parts[0]?.trim() || "";
    const roomId = parts[1]?.trim() || "";

    return (
      <div style={{
        backgroundColor: "#050505",
        borderColor: "#2a2a2f",
        borderRadius: "8px",
        color: "#f0f0f5",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        padding: "14px 18px",
        minWidth: "220px"
      }}>
        <p style={{
          color: "#e0e0ea",
          fontWeight: "600",
          fontSize: "16px",
          marginBottom: "10px",
          borderBottom: "1px solid #2a2a2f",
          paddingBottom: "8px"
        }}>
          {roomName}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ color: "#e0e0ea", fontWeight: "400", fontSize: "14px" }}>Room ID</span>
          <span style={{ color: "#e0e0ea", fontWeight: "500", fontSize: "15px" }}>{roomId}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#e0e0ea", fontWeight: "400", fontSize: "14px" }}>Bookings</span>
          <span style={{ color: "#ea580c", fontWeight: "500", fontSize: "15px" }}>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Кастомний форматтер для Y осі Revenue Overview
const formatYAxisTick = (value) => {
  // Не показуємо 0
  if (value === 0) return '';
  return value.toLocaleString();
};

// Базові налаштування для розрахунку динамічної ширини Y-осі Revenue Overview.
// Мета: підписи мають бути притиснуті максимально вліво (мінімальна ширина/відступ),
// але якщо сума зростає і текст довшої довжини — вісь "розсувається" вправо рівно
// настільки, щоб цифри не обрізались.
const REVENUE_Y_AXIS_FONT_SIZE = 14;
// Приблизна ширина одного символу для DM Sans при fontSize=14 (емпірично для цифр/ком)
const REVENUE_Y_AXIS_CHAR_WIDTH = 8.2;
// Мінімальна ширина осі (щоб короткі числа теж мали трохи "дихання")
const REVENUE_Y_AXIS_MIN_WIDTH = 28;
// Невеликий запас справа від тексту до самого графіка
const REVENUE_Y_AXIS_PADDING = 8;
// Мінімальний лівий відступ контейнера графіка (притискає все максимально вліво)
const REVENUE_CHART_MIN_LEFT_MARGIN = 0;

const AdminDashboard = () => {
  const [revenuePeriod, setRevenuePeriod] = useState(6);

  const { data: roomsData, loading: roomsLoading } = useQuery(QUERY_AllESCAPEROOMS, { fetchPolicy: "network-only" });
  const { data: bookingsData, loading: bookingsLoading } = useQuery(QUERY_ALLBOOKINGS, { fetchPolicy: "network-only" });
  const { data: usersData, loading: usersLoading } = useQuery(QUERY_ALLUSERS, { fetchPolicy: "network-only" });

  if (roomsLoading || bookingsLoading || usersLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e74c3c]"></div>
      </div>
    );
  }

  const rooms = roomsData?.getAllEscapeRooms || [];
  const bookings = bookingsData?.getAllBookings || [];
  const users = usersData?.getAllUsers || [];

  // ─── ЗАГАЛЬНИЙ ДОХІД ───
  const totalRevenue = bookings
    .filter((b) => b.payment_status === "completed")
    .reduce((sum, booking) => {
      const amount = booking.payment_amount || (booking.escaperoom?.price * booking.numberOfPlayers);
      return sum + (amount || 0);
    }, 0);

  // ─── ГРАФІК ДОХОДУ ───
  const monthlyRevenueData = () => {
    const months = [];
    const now = new Date();
    for (let i = revenuePeriod - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("en-US", { month: "short" });
      const yearStr = d.getFullYear().toString().slice(-2);

      const monthBookings = bookings.filter((b) => {
        const bd = new Date(b.date);
        return (
          bd.getMonth() === d.getMonth() &&
          bd.getFullYear() === d.getFullYear() &&
          b.payment_status === "completed"
        );
      });

      const revenue = monthBookings.reduce((sum, b) => {
        const amount = b.payment_amount || (b.escaperoom?.price * b.numberOfPlayers);
        return sum + (amount || 0);
      }, 0);

      months.push({ name: revenuePeriod > 6 ? `${monthName} ${yearStr}` : monthName, Revenue: revenue });
    }
    return months;
  };

  const revenueChartData = monthlyRevenueData();

  // Найдовший підпис, який реально буде показано на осі (formatYAxisTick ховає 0)
  const revenueMaxLabelLength = revenueChartData.reduce((max, item) => {
    const label = formatYAxisTick(item.Revenue);
    return Math.max(max, label.length);
  }, 1);

  // Динамічна ширина Y-осі: рівно стільки, скільки треба для найдовшого числа,
  // без зайвого "повітря" — тому підписи притиснуті максимально вліво.
  const revenueYAxisWidth = Math.max(
    REVENUE_Y_AXIS_MIN_WIDTH,
    Math.ceil(revenueMaxLabelLength * REVENUE_Y_AXIS_CHAR_WIDTH) + REVENUE_Y_AXIS_PADDING
  );

  // ─── ТОП КВЕСТ-КІМНАТ ───
  const topRoomsData = [...rooms]
    .map((room) => {
      const completedBookings = bookings.filter((b) => {
        const status = (b.status || "").toLowerCase();
        return status === "completed" && b.escaperoom?.theme === room.theme;
      });

      const latestCompletedDateTime = completedBookings.reduce((latest, b) => {
        const [hours, minutes, seconds] = (b.time || "00:00:00").split(":").map(Number);
        const dateTime = new Date(b.date);
        dateTime.setHours(hours || 0, minutes || 0, seconds || 0);

        return dateTime > latest ? dateTime : latest;
      }, new Date(0));

      return {
        name: `${room.theme} | ${room.id}`,
        Bookings: completedBookings.length,
        latestCompletedDateTime,
      };
    })
    .sort((a, b) => {
      if (b.Bookings !== a.Bookings) return b.Bookings - a.Bookings;
      return b.latestCompletedDateTime - a.latestCompletedDateTime;
    })
    .slice(0, 5)
    .map(({ name, Bookings }) => ({ name, Bookings }));

  // ─── СТАТУСИ БРОНЮВАНЬ ───
  const statusData = [
    { name: "Paid",      value: bookings.filter(b => b.payment_status === "completed").length },
    { name: "Pending",   value: bookings.filter(b => b.payment_status === "pending").length },
    { name: "Cancelled", value: bookings.filter(b => b.status === "cancelled" || b.payment_status === "cancelled").length },
  ].filter(item => item.value > 0);

  const PIE_COLORS = {
    Paid:      "#10b981",
    Pending:   "#f59e0b",
    Cancelled: "#ef4444"
  };

  const customTooltipStyle = {
    backgroundColor: "#050505",
    borderColor: "#2a2a2f",
    borderRadius: "8px",
    color: "#e0e0ea",
    fontSize: "14px",
    fontWeight: "400",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  };

  return (
    <div className="flex flex-col gap-8 pb-10 font-['DM_Sans',sans-serif]">

      {/* ─── ЗАГОЛОВОК ─── */}
      <div className="flex flex-col gap-1 shrink-0 mb-2">
        <h1 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">System Overview</h1>
        <p className="text-[#b0b0ba] text-base">General information and global statistics.</p>
      </div>

      {/* ─── КАРТКИ СТАТИСТИКИ ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Rooms"
          value={rooms.length}
          icon={DoorOpen}
          colorClass="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          colorClass="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          icon={CalendarDays}
          colorClass="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          title="Total Revenue"
          value={`${totalRevenue.toLocaleString()}`}
          icon={CreditCard}
          colorClass="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* ─── ГРАФІКИ ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* Топ Кімнат */}
        <div className="lg:col-span-7 bg-[#111113] border border-[#2a2a2f] p-7 rounded-2xl shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <BarChart3 size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f0f5]">Top Quest Rooms</h2>
              <p className="text-sm text-[#8a8a96] mt-0.5">Most popular rooms by completed missions</p>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoomsData} layout="vertical" barCategoryGap="28%" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2f" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#e0e0ea" fontSize={14} tickLine={false} axisLine={false} fontWeight={400} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<CustomYAxisTick />}
                  tickLine={false}
                  axisLine={false}
                  width={180}
                  interval={0}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#1a1a1f" }} />
                <Bar dataKey="Bookings" fill="#ea580c" radius={[0, 6, 6, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Статуси Бронювань */}
        <div className="lg:col-span-3 bg-[#111113] border border-[#2a2a2f] p-7 rounded-2xl shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <PieChartIcon size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f0f5]">Booking Status</h2>
              <p className="text-sm text-[#8a8a96] mt-0.5">Distribution of all orders</p>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: "#e0e0ea", fontSize: "14px", fontWeight: "400" }} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "15px", fontWeight: "400", color: "#e0e0ea" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#8a8a96] text-sm">No bookings data available.</p>
            )}
          </div>
        </div>

        {/* Графік Доходу */}
        <div className="lg:col-span-10 bg-[#111113] border border-[#2a2a2f] p-7 rounded-2xl shadow-lg flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#f0f0f5]">Revenue Overview</h2>
                <p className="text-sm text-[#8a8a96] mt-0.5">Financial performance over time</p>
              </div>
            </div>

            <div className="flex bg-[#050505] p-1 border border-[#2a2a2f] rounded-lg">
              <button
                onClick={() => setRevenuePeriod(3)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${revenuePeriod === 3 ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"}`}
              >
                3 Months
              </button>
              <button
                onClick={() => setRevenuePeriod(6)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${revenuePeriod === 6 ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"}`}
              >
                6 Months
              </button>
              <button
                onClick={() => setRevenuePeriod(12)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${revenuePeriod === 12 ? "bg-zinc-800 text-white" : "text-[#8a8a96] hover:text-[#d0d0da]"}`}
              >
                Year
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueChartData}
                margin={{ top: 10, right: 20, left: REVENUE_CHART_MIN_LEFT_MARGIN, bottom: 1 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2f" vertical={false} />
                <XAxis dataKey="name" stroke="#e0e0ea" fontSize={14} tickLine={false} axisLine={false} dy={6} fontWeight={400} />
                <YAxis
                  stroke="#e0e0ea"
                  fontSize={REVENUE_Y_AXIS_FONT_SIZE}
                  tickLine={false}
                  axisLine={false}
                  width={revenueYAxisWidth}
                  fontWeight={400}
                  tickFormatter={formatYAxisTick}
                  textAnchor="end"
                />
                <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: "#10b981", fontSize: "14px", fontWeight: "400" }} formatter={(value) => [`${value}`, "Revenue"]} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
