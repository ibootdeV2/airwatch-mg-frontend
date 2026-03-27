import { useEffect, useRef } from "react";

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

const AQI_LEVELS = [
  { color:"#22c55e", label:"Bon",          range:"0–50"    },
  { color:"#eab308", label:"Modéré",        range:"51–100"  },
  { color:"#f97316", label:"Mauvais (GS)",  range:"101–150" },
  { color:"#ef4444", label:"Mauvais",       range:"151–200" },
  { color:"#a855f7", label:"Très mauvais",  range:"201–300" },
  { color:"#7f1d1d", label:"Dangereux",     range:"300+"    },
];

export default function MapView({ cities, selected, onSelect }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (leafletRef.current) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (window.L) { initMap(); return; }
    const script  = document.createElement("script");
    script.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => initMap();
    document.head.appendChild(script);
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || leafletRef.current) return;
    const L   = window.L;
    const map = L.map(mapRef.current, {
      center: [-19.5, 46.8], zoom: 6,
      zoomControl: true, scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd", maxZoom: 19,
    }).addTo(map);
    leafletRef.current = map;
    if (cities?.length) addMarkers(map, cities, selected);
  };

  const addMarkers = (map, citiesData, selectedCity) => {
    const L = window.L;
    if (!L) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    citiesData.forEach(d => {
      if (!d.coordinates) return;
      const { lat, lon } = d.coordinates;
      const color = AQI_COLOR(d.aqi);
      const isSel = d.city === selectedCity;
      const size  = isSel ? 22 : 16;
      const icon  = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:${size+16}px;height:${size+16}px;">
          ${isSel ? `<div style="position:absolute;top:0;left:0;width:${size+16}px;height:${size+16}px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:pulse-ring 1.5s ease-out infinite;"></div>` : ""}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer;"></div>
        </div>`,
        iconSize:   [size+16, size+16],
        iconAnchor: [(size+16)/2, (size+16)/2],
      });
      const marker = L.marker([lat, lon], { icon }).addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:150px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${d.city}</div>
            <div style="color:${color};font-size:24px;font-weight:800;line-height:1;">AQI ${d.aqi ?? "—"}</div>
            <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${AQI_LABEL(d.aqi)}</div>
            ${d.simulated ? '<div style="color:#f59e0b;font-size:11px;margin-top:4px;">⚡ Données estimées</div>' : '<div style="color:#22c55e;font-size:11px;margin-top:4px;">✓ Capteur WAQI</div>'}
            <button onclick="window._aqiSelect('${d.city}')" style="margin-top:8px;width:100%;padding:6px;background:${color};color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
              Voir les détails →
            </button>
          </div>`, { maxWidth: 210 });
      marker.on("click", () => onSelect(d.city));
      markersRef.current[d.city] = marker;
    });
    window._aqiSelect = (city) => { onSelect(city); map.closePopup(); };
  };

  useEffect(() => {
    if (!leafletRef.current || !cities?.length) return;
    addMarkers(leafletRef.current, cities, selected);
  }, [cities, selected]);

  useEffect(() => {
    if (!leafletRef.current || !selected || !cities) return;
    const city = cities.find(c => c.city === selected);
    if (city?.coordinates) {
      leafletRef.current.flyTo([city.coordinates.lat, city.coordinates.lon], 8, { duration: 1.2 });
      const marker = markersRef.current[selected];
      if (marker) setTimeout(() => marker.openPopup(), 1300);
    }
  }, [selected]);

  // Diviser la liste en deux moitiés
  const half      = Math.ceil(cities.length / 2);
  const leftList  = cities.slice(0, half);
  const rightList = cities.slice(half);

  return (
    <div className="map-wrap">
      <style>{`
        @keyframes pulse-ring {
          0%   { transform:scale(0.8); opacity:0.6; }
          100% { transform:scale(1.8); opacity:0;   }
        }
        .leaflet-popup-content-wrapper {
          background:#1e293b !important; color:#f1f5f9 !important;
          border:1px solid #334155 !important; border-radius:10px !important;
          box-shadow:0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip        { background:#1e293b !important; }
        .leaflet-popup-close-button { color:#94a3b8 !important; }
        .leaflet-control-zoom a   { background:#1e293b !important; color:#f1f5f9 !important; border-color:#334155 !important; }
        .leaflet-control-attribution { background:rgba(10,15,26,0.7)!important; color:#64748b!important; }
      `}</style>

      {/* ── Layout : liste gauche | carte | liste droite ── */}
      <div style={{ display:"grid", gridTemplateColumns:"180px 1fr 180px", gap:16, alignItems:"start" }}>

        {/* Liste gauche */}
        <CityList cities={leftList} selected={selected} onSelect={onSelect} />

        {/* Carte centrale */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div
            ref={mapRef}
            style={{ height:520, borderRadius:12, overflow:"hidden", border:"1px solid #1e293b" }}
          />
          {/* Indicateur AQI en bas de la carte */}
          <AQIIndicator cities={cities} selected={selected} onSelect={onSelect} />
        </div>

        {/* Liste droite */}
        <CityList cities={rightList} selected={selected} onSelect={onSelect} align="right" />
      </div>
    </div>
  );
}

/* ── Liste de villes (gauche ou droite) ── */
function CityList({ cities, selected, onSelect, align = "left" }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", gap:2,
      background:"#111827", borderRadius:10, padding:"10px 0",
      border:"1px solid #1e293b",
    }}>
      <div style={{
        fontSize:10, color:"#475569", textTransform:"uppercase",
        letterSpacing:"0.5px", padding:"4px 12px 8px",
        borderBottom:"1px solid #1e293b", marginBottom:4,
        textAlign: align,
      }}>
        Villes
      </div>
      {cities.map(d => (
        <button
          key={d.city}
          onClick={() => onSelect(d.city)}
          style={{
            display:"flex",
            flexDirection: align === "right" ? "row-reverse" : "row",
            alignItems:"center",
            gap:8,
            padding:"6px 12px",
            background: d.city === selected ? "#1e293b" : "transparent",
            border:"none",
            borderLeft:  align === "left"  && d.city === selected ? `3px solid ${AQI_COLOR(d.aqi)}` : "3px solid transparent",
            borderRight: align === "right" && d.city === selected ? `3px solid ${AQI_COLOR(d.aqi)}` : "3px solid transparent",
            cursor:"pointer",
            transition:"all 0.15s",
            fontFamily:"inherit",
          }}
        >
          <span style={{
            width:7, height:7, borderRadius:"50%", flexShrink:0,
            background: AQI_COLOR(d.aqi),
          }}/>
          <span style={{
            fontSize:12,
            color: d.city === selected ? "#f1f5f9" : "#64748b",
            fontWeight: d.city === selected ? 600 : 400,
            flex:1,
            textAlign: align,
          }}>
            {d.city}
          </span>
          <span style={{
            fontSize:12, fontWeight:700,
            color: AQI_COLOR(d.aqi),
            fontFamily:"monospace",
          }}>
            {d.aqi ?? "—"}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Indicateur AQI sous la carte ── */
function AQIIndicator({ cities, selected, onSelect }) {
  return (
    <div style={{ background:"#111827", borderRadius:10, padding:"12px 16px", border:"1px solid #1e293b" }}>
      {/* Légende compacte */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:"0.5px" }}>
          Indice AQI
        </span>
        {/* Barre de légende */}
        <div style={{ display:"flex", gap:4 }}>
          {AQI_LEVELS.map(l => (
            <div key={l.label} title={`${l.label} (${l.range})`}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ width:28, height:8, borderRadius:4, background:l.color }}/>
              <span style={{ fontSize:9, color:"#475569" }}>{l.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pastilles des villes (miniatures cliquables) */}
      
    </div>
  );
}
