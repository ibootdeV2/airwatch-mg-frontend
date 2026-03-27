import { useState } from "react";
import { api } from "../services/api";

const AQI_COLOR = (aqi) => {
  if (!aqi) return "#64748b";
  if (aqi <= 50)  return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#a855f7";
  return "#7f1d1d";
};

const AQI_LABEL = (aqi) => {
  if (!aqi) return "N/A";
  if (aqi <= 50)  return "Bon";
  if (aqi <= 100) return "Modéré";
  if (aqi <= 150) return "Mauvais (GS)";
  if (aqi <= 200) return "Mauvais";
  if (aqi <= 300) return "Très mauvais";
  return "Dangereux";
};

const CONFIDENCE_COLOR = {
  "Très élevée": "#22c55e",
  "Élevée":      "#86efac",
  "Bonne":       "#eab308",
  "Modérée":     "#f97316",
  "Faible":      "#ef4444",
  "Très faible": "#7f1d1d",
};

// Retourne la date/heure minimum (maintenant + 1h) au format datetime-local
function minDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

// Retourne la date/heure maximum (maintenant + 30 jours)
function maxDateTime() {
  const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday:"long", day:"2-digit", month:"long",
    year:"numeric", hour:"2-digit", minute:"2-digit"
  });
}

// ── Composant résultat prédiction ──
function PredictionResult({ data, city, isFuture }) {
  const pred       = isFuture ? data.prediction : data.prediction;
  const pm25       = pred.pm25_predicted;
  const aqi        = isFuture ? pred.aqi_estimated : (data.inputs_used?.aqi || null);
  const color      = AQI_COLOR(aqi);
  const pct        = Math.min((pm25 / 150) * 100, 100);
  const confidence = isFuture ? data.confidence : null;
  const adj        = isFuture ? data.adjustments : null;

  return (
    <div className="pred-result-wrap">
      {/* Valeur principale */}
      <div className="pred-result-card" style={{ borderColor: color }}>
        <div className="pred-value" style={{ color }}>
          {pm25}
          <span className="pred-unit"> µg/m³</span>
        </div>
        <div className="pred-label">PM2.5 prédit</div>

        {aqi && (
          <div className="pred-aqi-badge" style={{ background: color + "22", border: `1px solid ${color}` }}>
            <span style={{ color }}>AQI ≈ {aqi}</span>
            <span style={{ color, marginLeft: 8, fontWeight: 700 }}>{AQI_LABEL(aqi)}</span>
          </div>
        )}

        <div className="pred-ci">
          Intervalle 95% : [{pred.confidence_low} – {pred.confidence_high}] µg/m³
        </div>
        <div className={pred.exceeds_who ? "who-danger" : "who-ok"}>
          {pred.exceeds_who
            ? `⚠ Dépasse la limite OMS (${pred.who_limit} µg/m³)`
            : `✓ Dans les limites OMS (${pred.who_limit} µg/m³)`}
        </div>
      </div>

      {/* Barre PM2.5 */}
      <div className="pred-bar-section">
        <div className="pred-bar-label">
          <span>0</span><span>OMS: {pred.who_limit}</span><span>150 µg/m³</span>
        </div>
        <div className="pred-bar-bg">
          <div className="pred-bar-fill" style={{ width:`${pct}%`, background: color }}/>
          <div className="pred-bar-who" style={{ left:`${(pred.who_limit/150)*100}%` }}/>
        </div>
      </div>

      {/* Confiance (prédiction future uniquement) */}
      {confidence && (
        <div className="pred-confidence">
          <div className="pred-conf-header">
            <span className="pred-conf-label">Confiance de la prédiction</span>
            <span style={{ color: CONFIDENCE_COLOR[confidence.level] || "#64748b", fontWeight:700 }}>
              {confidence.level} — {confidence.percent}%
            </span>
          </div>
          <div className="pred-conf-bar-bg">
            <div className="pred-conf-bar-fill"
              style={{ width:`${confidence.percent}%`,
                background: CONFIDENCE_COLOR[confidence.level] || "#64748b" }}/>
          </div>
          <div className="pred-conf-note">
            Horizon : {confidence.hours_ahead}h · La confiance diminue avec l'horizon temporel
          </div>
        </div>
      )}

      {/* Facteurs d'ajustement */}
      {adj && (
        <div className="pred-adjustments">
          <div className="pred-adj-title">Facteurs d'ajustement appliqués</div>
          <div className="pred-adj-grid">
            <div className="pred-adj-item">
              <span>🕐 Heure de la journée</span>
              <span style={{ color: "#38bdf8" }}>×{adj.hour_factor}</span>
            </div>
            <div className="pred-adj-item">
              <span>🌦 Saison</span>
              <span style={{ color: "#38bdf8" }}>×{adj.season_factor}</span>
            </div>
            <div className="pred-adj-item">
              <span>📉 Incertitude horizon</span>
              <span style={{ color: "#f97316" }}>−{Math.round(adj.horizon_decay*100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Conditions actuelles */}
      {data.current_conditions && (
        <div className="pred-inputs">
          <div className="pred-inputs-title">Conditions actuelles utilisées</div>
          <div className="pred-inputs-grid">
            {Object.entries(data.current_conditions).map(([k,v]) =>
              v != null && (
                <div key={k} className="pred-input-item">
                  <span className="pred-input-key">{k.replace(/_/g," ")}</span>
                  <span className="pred-input-val">{v}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ──
export default function PredictionPanel({ prediction, city }) {
  const [tab,         setTab]         = useState("now");
  const [targetDate,  setTargetDate]  = useState(minDateTime());
  const [futureData,  setFutureData]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setFutureData(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/predict/future`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            city,
            target_date: new Date(targetDate).toISOString().slice(0,19),
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erreur API");
      }
      setFutureData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-wrap">
      <h3 className="section-title">Prédiction PM2.5 — {city}</h3>

      {/* Onglets */}
      <div className="pred-tabs">
        <button
          className={`pred-tab ${tab === "now" ? "pred-tab-active" : ""}`}
          onClick={() => setTab("now")}
        >
          🕐 Prochaine heure
        </button>
        <button
          className={`pred-tab ${tab === "future" ? "pred-tab-active" : ""}`}
          onClick={() => setTab("future")}
        >
          📅 Date & heure future
        </button>
      </div>

      {/* ── Onglet Prochaine heure ── */}
      {tab === "now" && prediction && (
        <PredictionResult data={prediction} city={city} isFuture={false} />
      )}

      {/* ── Onglet Date future ── */}
      {tab === "future" && (
        <div className="pred-future-wrap">

          {/* Sélecteur date/heure */}
          <div className="pred-date-picker">
            <div className="pred-date-label">
              <span className="pred-date-icon">📅</span>
              <span>Choisir une date et heure future</span>
              <span className="pred-date-hint">(max 30 jours)</span>
            </div>

            <div className="pred-date-row">
              <input
                type="datetime-local"
                className="pred-datetime-input"
                value={targetDate}
                min={minDateTime()}
                max={maxDateTime()}
                onChange={e => setTargetDate(e.target.value)}
              />
              <button
                className="pred-btn"
                onClick={handlePredict}
                disabled={loading}
              >
                {loading ? "⏳ Calcul..." : "🔮 Prédire"}
              </button>
            </div>

            {targetDate && (
              <div className="pred-date-preview">
                📍 {formatDateTime(targetDate)}
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="pred-error">⚠ {error}</div>
          )}

          {/* Résultat futur */}
          {futureData && !loading && (
            <div>
              <div className="pred-future-header">
                <span className="pred-future-for">Prédiction pour</span>
                <span className="pred-future-date">{formatDateTime(futureData.target_time)}</span>
                <span className="pred-future-horizon">({futureData.hours_ahead}h dans le futur)</span>
              </div>
              <PredictionResult data={futureData} city={city} isFuture={true} />
            </div>
          )}

          {/* Placeholder vide */}
          {!futureData && !loading && !error && (
            <div className="pred-empty">
              <div className="pred-empty-icon">🔮</div>
              <div>Sélectionnez une date et heure future puis cliquez sur <strong>Prédire</strong></div>
              <div className="pred-empty-note">
                Le modèle utilise les conditions actuelles + patterns journaliers et saisonniers de Madagascar
              </div>
            </div>
          )}
        </div>
      )}

      <p className="prediction-note" style={{ marginTop: 16 }}>
        Modèle LinearRegression entraîné sur données réelles Antananarivo (9870 mesures).
        La confiance diminue avec l'horizon temporel.
      </p>
    </div>
  );
}
