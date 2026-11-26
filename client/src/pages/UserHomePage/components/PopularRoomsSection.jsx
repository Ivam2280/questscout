import { useState } from "react";
import { motion } from "framer-motion";
import { DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";
import HomeSectionHeader from "./HomeSectionHeader";

function getRoomImage(room) {
  if (room.image_url) return room.image_url;
  if (room.image) return room.image;
  if (Array.isArray(room.images)) return room.images[0] ?? null;

  if (typeof room.images === "string") {
    try {
      const parsed = JSON.parse(room.images);
      return Array.isArray(parsed) ? parsed[0] ?? null : room.images;
    } catch {
      return room.images;
    }
  }

  return null;
}

function RoomImage({ room }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getRoomImage(room);

  if (!imageUrl || hasError) {
    return (
      <div className="home-room-image home-room-image-fallback" aria-hidden="true">
        <DoorOpen size={48} />
      </div>
    );
  }

  return (
    <img
      className="home-room-image"
      src={imageUrl}
      alt={room.theme || "Escape room"}
      onError={() => setHasError(true)}
    />
  );
}

export default function PopularRoomsSection({ rooms }) {
  const popularRooms = rooms.slice(0, 3);

  if (!popularRooms.length) return null;

  return (
    <section id="rooms" className="home-section">
      <div className="home-section-inner">
        <HomeSectionHeader
          title="Trending"
          accent="Missions"
          linkTo="/escaperooms"
          linkLabel="View All Catalog"
        />

        <div className="home-room-grid">
          {popularRooms.map((room, index) => {
            const roomId = room.id || room._id;
            return (
              <Link className="home-room-link" to={`/booking/${roomId}`} key={roomId}>
                <motion.article
                  className="home-room-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                >
                  <div className="home-room-media">
                    <RoomImage room={room} />
                  </div>
                  <div className="home-room-content">
                    <p className="home-room-genre qs-condensed">{room.genre || "Mystery"}</p>
                    <h3 className="home-room-title qs-display">{room.theme || "Unknown Room"}</h3>
                    <p className="home-room-description">
                      {room.description ||
                        "Infiltrate the objective, solve the puzzles, and escape before time runs out. Are you ready for the challenge?"}
                    </p>
                  </div>
                </motion.article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
