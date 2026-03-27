export default function CityCard({ data, selected, onClick }) {
  const { city, aqi, aqi_level } = data;
  return (
    <div
      className={`city-card ${selected ? "city-card-selected" : ""}`}
      onClick={onClick}
      style={{"--accent": aqi_level?.color || "#64748b"}}
    >
      <div className="city-card-header">
        <span className="city-card-name">{city}</span>
        <span className="city-card-dot" style={{background: aqi_level?.color}}/>
      </div>
      <div className="city-card-aqi">{aqi ?? "—"}</div>
      <div className="city-card-label">{aqi_level?.label || "N/A"}</div>
    </div>
  );
}
