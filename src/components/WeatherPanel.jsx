const WMO_ICONS = {
  0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️",
  45:"🌫️", 48:"🌫️",
  51:"🌦️", 53:"🌦️", 55:"🌧️",
  61:"🌧️", 63:"🌧️", 65:"🌧️",
  80:"🌦️", 81:"🌧️", 82:"⛈️",
  95:"⛈️", 96:"⛈️", 99:"⛈️",
};

export default function WeatherPanel({ data }) {
  const icon = WMO_ICONS[data.weather_code] || "🌡️";
  return (
    <div className="weather-panel">
      <div className="weather-icon">{icon}</div>
      <div className="weather-grid">
        <WeatherStat label="Température" value={`${data.temperature}°C`} />
        <WeatherStat label="Humidité"    value={`${data.humidity}%`} />
        <WeatherStat label="Vent"        value={`${data.wind_speed} km/h`} />
        <WeatherStat label="Précip."     value={`${data.precipitation ?? 0} mm`} />
      </div>
    </div>
  );
}

function WeatherStat({ label, value }) {
  return (
    <div className="weather-stat">
      <span className="weather-stat-label">{label}</span>
      <span className="weather-stat-value">{value}</span>
    </div>
  );
}
