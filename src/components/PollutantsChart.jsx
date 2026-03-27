const LIMITS = { pm25: 15, pm10: 45, o3: 100, no2: 25, so2: 40, co: 4 };
const LABELS = { pm25:"PM2.5", pm10:"PM10", o3:"O₃", no2:"NO₂", so2:"SO₂", co:"CO" };
const UNITS  = { pm25:"µg/m³", pm10:"µg/m³", o3:"µg/m³", no2:"µg/m³", so2:"µg/m³", co:"mg/m³" };

export default function PollutantsChart({ pollutants, city }) {
  return (
    <div className="pollutants-wrap">
      <h3 className="section-title">Polluants — {city}</h3>
      <div className="pollutant-grid">
        {Object.entries(pollutants || {}).map(([key, val]) => {
          if (val == null) return null;
          const limit = LIMITS[key] || 100;
          const pct   = Math.min((val / limit) * 100, 100);
          const over  = val > limit;
          return (
            <div key={key} className="pollutant-card">
              <div className="pollutant-top">
                <span className="pollutant-name">{LABELS[key]}</span>
                <span className="pollutant-val">{val} <small>{UNITS[key]}</small></span>
              </div>
              <div className="pollutant-bar-bg">
                <div
                  className="pollutant-bar"
                  style={{
                    width: `${pct}%`,
                    background: over ? "#ef4444" : "#22c55e",
                    transition: "width 0.7s ease"
                  }}
                />
              </div>
              <div className="pollutant-limit">
                Limite OMS : {limit} {UNITS[key]}
                {over && <span className="pollutant-alert"> ⚠ Dépassé</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
