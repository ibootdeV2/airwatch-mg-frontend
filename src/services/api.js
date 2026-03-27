const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getCities:         ()     => apiFetch("/api/air/cities"),
  getAllAirQuality:   ()     => apiFetch("/api/air/all"),
  getCityAirQuality: (city) => apiFetch(`/api/air/city/${encodeURIComponent(city)}`),
  getCityWeather:    (city) => apiFetch(`/api/weather/${encodeURIComponent(city)}`),
  predictCity:       (city) => apiFetch(`/api/predict/city/${encodeURIComponent(city)}`),
  predictPm25:       (data) => apiPost("/api/predict/pm25", data),
};
