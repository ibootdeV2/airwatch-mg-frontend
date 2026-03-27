/**
 * Badge affiché sur les villes sans capteur réel.
 * Montre la méthode d'estimation et les villes voisines utilisées.
 */
export default function EstimationBadge({ data }) {
  if (!data?.simulated) return null;

  const details  = data.estimation_details;
  const source   = data.source;

  const SOURCE_LABELS = {
    "interpolation+ml": { label: "Interpolation + ML météo", color: "#38bdf8" },
    "interpolation":    { label: "Interpolation voisins",    color: "#22c55e" },
    "ml_meteo":         { label: "ML météo uniquement",      color: "#a855f7" },
    "default":          { label: "Valeur par défaut",        color: "#64748b" },
  };

  const info = SOURCE_LABELS[source] || SOURCE_LABELS["default"];

  return (
    <div className="estimation-badge">
      <div className="estimation-header">
        <span className="estimation-icon">⚡</span>
        <span className="estimation-title">Données estimées</span>
        <span className="estimation-method" style={{ color: info.color }}>
          {info.label}
        </span>
      </div>

      {details?.neighbors?.length > 0 && (
        <div className="estimation-neighbors">
          <span className="estimation-nb-label">Villes voisines utilisées :</span>
          <div className="estimation-nb-list">
            {details.neighbors.map(n => (
              <span key={n.city} className="estimation-nb-tag">
                📍 {n.city} <small>({n.dist_km} km)</small>
              </span>
            ))}
          </div>
        </div>
      )}

      {details?.ml_used && details?.weather && (
        <div className="estimation-weather">
          <span className="estimation-nb-label">Météo utilisée pour ML :</span>
          <div className="estimation-nb-list">
            <span className="estimation-nb-tag">🌡 {details.weather.temperature}°C</span>
            <span className="estimation-nb-tag">💧 {details.weather.humidity}%</span>
            <span className="estimation-nb-tag">💨 {details.weather.wind_speed} km/h</span>
          </div>
        </div>
      )}
    </div>
  );
}
