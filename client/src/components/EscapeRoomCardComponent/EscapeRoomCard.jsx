import { Link } from "react-router-dom";
import { FaUsers, FaClock, FaChild } from "react-icons/fa";

const EscapeRoomCard = ({ room }) => {
  const ageValue = room.ageGroup || "16+";

  return (
    <Link
      to={`/booking/${room.id}`}
      className="group block bg-[#0c0c0e] border border-[#222227] rounded-md overflow-hidden transition-all duration-300 hover:border-[#c0392b]/70 hover:shadow-[0_0_30px_rgba(192,57,43,0.1)] h-full w-full"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <img
          src={room.image_url}
          alt={room.theme}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-100" />
      </div>

      <div className="p-5 flex flex-col gap-3">
        {room.genre && (
          <div className="flex items-center">
            <span className="text-[16.94px] uppercase tracking-[0.25em] text-[#e74c3c] font-['Barlow_Condensed'] font-bold">
              {room.genre}
            </span>
          </div>
        )}

        <h3 className="font-['Bebas_Neue',cursive] text-4xl tracking-[0.05em] text-white uppercase group-hover:text-[#e74c3c] transition-colors duration-300 leading-[0.9] line-clamp-1 -mt-1">
          {room.theme}
        </h3>

        <div className="flex items-center gap-4 pt-1 border-t border-[#1c1c21] text-[16.94px] font-semibold text-[#b0b0ba] uppercase tracking-[0.121em] font-['Barlow_Condensed']">
          <span className="flex items-center gap-2">
            <FaUsers className="text-[#c0392b] text-[16.94px]" />
            {room.playersMin}-{room.playersMax}
          </span>
          <span className="flex items-center gap-2">
            <FaChild className="text-[#c0392b] text-[16.94px]" />
            {ageValue}
          </span>
          <span className="flex items-center gap-2">
            <FaClock className="text-[#c0392b] text-[16.94px]" />
            {room.duration} MIN
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EscapeRoomCard;
