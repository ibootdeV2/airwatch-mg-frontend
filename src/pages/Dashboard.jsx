import { useState, useEffect } from "react";
import { api } from "../services/api";
import CitySelector from "../components/CitySelector";
import AQIGauge from "../components/AQIGauge";
import PollutantsChart from "../components/PollutantsChart";
import WeatherPanel from "../components/WeatherPanel";
import PredictionPanel from "../components/PredictionPanel";
import MapView from "../components/MapView";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState("Antananarivo");
  const [allData,      setAllData]      = useState([]);
  const [cityData,     setCityData]     = useState(null);
  const [weatherData,  setWeatherData]  = useState(null);
  const [prediction,   setPrediction]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("overview");

  useEffect(() => {
    api.getAllAirQuality().then(d => setAllData(d.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setCityData(null); setWeatherData(null); setPrediction(null);
    Promise.all([
      api.getCityAirQuality(selectedCity),
      api.getCityWeather(selectedCity),
      api.predictCity(selectedCity),
    ])
      .then(([air, weather, pred]) => {
        setCityData(air);
        setWeatherData(weather);
        setPrediction(pred);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const aqi      = cityData?.aqi;
  const aqiLevel = cityData?.aqi_level;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner" style={{ padding: "14px 24px" }}>
          <div className="logo">
            <img src={logo} alt="logo" className="logo-icon" />
            <div>
              <h1>AirWatch<span className="accent">-MG</span></h1>
              <p>Surveillance qualité de l'air — Madagascar</p>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* ── SIDEBAR : sélecteur province / ville ── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Provinces &amp; Villes</div>
          </div>
          <CitySelector
            selectedCity={selectedCity}
            onSelect={(city) => { setSelectedCity(city); setActiveTab("overview"); }}
          />
        </aside>

        {/* ── CONTENU PRINCIPAL ── */}
        <main className="main-content">
          {/* Hero AQI + Météo */}
          <section className="hero" style={{ "--aqi-color": aqiLevel?.color || "#22c55e" }}>
            <div className="hero-left">
              <div className="city-title">
                <h2>{selectedCity}</h2>
                <span className="aqi-badge" style={{ background: aqiLevel?.color }}>
                  {aqiLevel?.label || "—"}
                </span>
                {cityData?.simulated && (
                  <span style={{ fontSize: 11, color: "#f59e0b" }}>⚠ estimé</span>
                )}
              </div>
              {loading
                ? <div className="skeleton-aqi" />
                : <AQIGauge aqi={aqi} level={aqiLevel} />
              }
            </div>
            <div className="hero-right">
              {weatherData && <WeatherPanel data={weatherData} />}
            </div>
          </section>

          {/* Tabs */}
          <div className="tabs">
            {["overview","pollutants","prediction","map"].map(t => (
              <button
                key={t}
                className={`tab ${activeTab === t ? "tab-active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {{ overview:"Vue d'ensemble", pollutants:"Polluants",
                   prediction:"Prédiction", map:"Carte" }[t]}
              </button>
            ))}
          </div>

          {/* Contenu onglets */}
          <div className="content">
            {activeTab === "overview" && (
              <div className="grid-3">
                {allData.map(d => (
                  <div
                    key={d.city}
                    className={`city-card ${d.city === selectedCity ? "city-card-selected" : ""}`}
                    style={{ "--accent": d.aqi_level?.color || "#64748b" }}
                    onClick={() => setSelectedCity(d.city)}
                  >
                    <div className="city-card-header">
                      <span className="city-card-name">{d.city}</span>
                      <span className="city-card-dot" style={{ background: d.aqi_level?.color }} />
                    </div>
                    <div className="city-card-aqi">{d.aqi ?? "—"}</div>
                    <div className="city-card-label">{d.aqi_level?.label || "N/A"}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "pollutants" && cityData && (
              <PollutantsChart pollutants={cityData.pollutants} city={selectedCity} />
            )}
            {activeTab === "prediction" && prediction && (
              <PredictionPanel prediction={prediction} city={selectedCity} />
            )}
            {activeTab === "map" && (
              <MapView cities={allData} selected={selectedCity} onSelect={setSelectedCity} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
