import "./google.css";

export default function GoogleMapComponent() {
  return <iframe
    title="QuestScout location in Kharkiv"
    className="map-container"
    loading="lazy"
    referrerPolicy="no-referrer"
    src="https://www.openstreetmap.org/export/embed.html?bbox=36.218%2C50.010%2C36.236%2C50.021&layer=mapnik&marker=50.01538%2C36.22741"
    style={{ width: "100%", minHeight: 320, border: 0 }}
  />;
}
