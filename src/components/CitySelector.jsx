import { useState } from "react";

const HIERARCHY = {
  "Antananarivo": {
    color: "#38bdf8",
    regions: {
      "Analamanga":     ["Antananarivo","Ambohidratrimo","Anjozorobe","Andramasina","Manjakandriana"],
      "Vakinankaratra": ["Antsirabe","Ambatolampy","Faratsiho","Betafo","Mandoto"],
      "Itasy":          ["Miarinarivo","Arivonimamo","Soavinandriana"],
      "Bongolava":      ["Tsiroanomandidy","Fenoarivobe"],
    }
  },
  "Toamasina": {
    color: "#22c55e",
    regions: {
      "Atsinanana":      ["Toamasina","Mahanoro","Vatomandry","Marolambo","Brickaville"],
      "Alaotra-Mangoro": ["Moramanga","Ambatondrazaka","Andilamena","Anosibe An'ala","Amparafaravola"],
      "Analanjirofo":    ["Fenerive Est","Soanierana Ivongo","Mananara Nord","Maroantsetra","Sainte Marie"],
    }
  },
  "Mahajanga": {
    color: "#f97316",
    regions: {
      "Boeny":     ["Mahajanga","Marovoay","Mitsinjo","Soalala","Ambato Boeny"],
      "Sofia":     ["Port Berger","Analalava","Bealanana","Mandritsara","Befandriana Nord"],
      "Betsiboka": ["Maevatanana","Kandreho","Tsaratanana"],
      "Melaky":    ["Maintirano","Morafenobe","Besalampy"],
    }
  },
  "Fianarantsoa": {
    color: "#a855f7",
    regions: {
      "Haute Matsiatra":     ["Fianarantsoa","Ambalavao","Ikalamavony","Isandra"],
      "Amoron'i Mania":      ["Ambositra","Fandriana","Manandriana","Ambohimahasoa"],
      "Ihorombe":            ["Ihosy","Ivohibe","Iakora"],
      "Vatovavy-Fitovinany": ["Manakara","Mananjary","Ifanadiana","Ikongo"],
      "Atsimo-Atsinanana":   ["Farafangana","Vangaindrano","Midongy Atsimo","Befotaka"],
    }
  },
  "Toliara": {
    color: "#eab308",
    regions: {
      "Atsimo-Andrefana": ["Toliara","Betioky","Ampanihy","Sakaraha","Morombe"],
      "Androy":           ["Ambovombe","Bekily","Beloha","Tsihombe"],
      "Anosy":            ["Taolagnaro","Betroka","Amboasary"],
      "Menabe":           ["Morondava","Manja","Miandrivazo","Mahabo"],
    }
  },
  "Antsiranana": {
    color: "#ef4444",
    regions: {
      "Diana": ["Antsiranana","Nosy Be","Ambanja","Ambilobe","Nosy Mitsio"],
      "Sava":  ["Sambava","Antalaha","Vohémar","Andapa"],
    }
  },
};

// Trouve la province et la région d'une ville
function findLocation(city) {
  for (const [prov, { regions }] of Object.entries(HIERARCHY)) {
    for (const [region, cities] of Object.entries(regions)) {
      if (cities.includes(city)) return { prov, region };
    }
  }
  return { prov: "Antananarivo", region: "Analamanga" };
}

export default function CitySelector({ selectedCity, onSelect }) {
  const loc = findLocation(selectedCity);
  const [openProv,   setOpenProv]   = useState(loc.prov);
  const [openRegion, setOpenRegion] = useState(loc.region);

  const totalCities = Object.values(HIERARCHY)
    .flatMap(p => Object.values(p.regions))
    .flat().length;

  return (
    <div className="city-selector-panel">
      <div className="selector-stats">
        <span>6 provinces · 22 régions · {totalCities} villes</span>
      </div>

      {Object.entries(HIERARCHY).map(([prov, { color, regions }]) => {
        const isProvOpen  = openProv === prov;
        const hasSelProv  = findLocation(selectedCity).prov === prov;

        return (
          <div key={prov} className="province-group">

            {/* ── En-tête Province ── */}
            <button
              className={`province-header ${isProvOpen ? "prov-open" : ""} ${hasSelProv ? "prov-active" : ""}`}
              style={{ "--pc": color }}
              onClick={() => setOpenProv(isProvOpen ? null : prov)}
            >
              <span className="prov-dot" style={{ background: color }} />
              <span className="prov-name">{prov}</span>
              <span className="prov-badge">{Object.values(regions).flat().length}</span>
              <span className="prov-arrow">{isProvOpen ? "▲" : "▼"}</span>
            </button>

            {/* ── Régions ── */}
            {isProvOpen && Object.entries(regions).map(([region, cities]) => {
              const isRegOpen  = openRegion === region;
              const hasSelReg  = findLocation(selectedCity).region === region;

              return (
                <div key={region} className="region-group">

                  {/* En-tête Région */}
                  <button
                    className={`region-header ${isRegOpen ? "reg-open" : ""} ${hasSelReg ? "reg-active" : ""}`}
                    style={{ "--pc": color }}
                    onClick={() => setOpenRegion(isRegOpen ? null : region)}
                  >
                    <span className="reg-icon" style={{ borderColor: color }}>
                      {isRegOpen ? "−" : "+"}
                    </span>
                    <span className="reg-name">{region}</span>
                    <span className="reg-count">{cities.length}</span>
                  </button>

                  {/* Villes */}
                  {isRegOpen && (
                    <div className="cities-list">
                      {cities.map(city => {
                        const isActive = selectedCity === city;
                        return (
                          <button
                            key={city}
                            className={`city-item ${isActive ? "city-active" : ""}`}
                            style={{ "--pc": color }}
                            onClick={() => onSelect(city)}
                          >
                            <span
                              className="city-dot"
                              style={{
                                background:   isActive ? color : "transparent",
                                borderColor:  color,
                              }}
                            />
                            <span className="city-label">{city}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
