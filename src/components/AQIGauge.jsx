import { useEffect, useRef } from "react";

const CX = 120, CY = 120, R = 82;
const ARC_START   = -220;
const ARC_TOTAL   = 260;
const BASE_OFFSET = ARC_START + 90; // -130°

// Haut de l'arc = CY - R = 38  |  Pivot = CY = 120
// Centre exact  = (38 + 120) / 2 = 79
const VAL_Y = (CY - R + CY) / 2; // = 79

function toRad(d) { return d * Math.PI / 180; }
function pt(deg, r) {
  return { x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) };
}
function arcPath(s, e, r) {
  const a = pt(s, r), b = pt(e, r), lg = Math.abs(e - s) > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 ${lg} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
const LEVELS = [[50,"#22c55e"],[100,"#eab308"],[150,"#f97316"],[200,"#ef4444"],[300,"#a855f7"],[500,"#7f1d1d"]];
function getColor(v) { for (const [m,c] of LEVELS) if (v<=m) return c; return "#7f1d1d"; }

export default function AQIGauge({ aqi, level }) {
  const needleRef = useRef(null);
  const arcRef    = useRef(null);
  const valRef    = useRef(null);

  const value = aqi ?? 0;
  const pct   = Math.min(value / 500, 1);
  const color = level?.color || getColor(value);

  useEffect(() => {
    const angleDeg = BASE_OFFSET + pct * ARC_TOTAL;
    if (needleRef.current)
      needleRef.current.setAttribute("transform", `rotate(${angleDeg.toFixed(2)}, ${CX}, ${CY})`);
    if (arcRef.current) {
      if (value > 0) {
        arcRef.current.setAttribute("d", arcPath(ARC_START, ARC_START + pct * ARC_TOTAL, R));
        arcRef.current.setAttribute("stroke", color);
      } else {
        arcRef.current.setAttribute("d", "");
      }
    }
    if (valRef.current) valRef.current.textContent = value;
  }, [value, pct, color]);

  const minPt = pt(ARC_START,             R + 14);
  const maxPt = pt(ARC_START + ARC_TOTAL, R + 14);

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 240 175" width="280" style={{ overflow: "visible" }}>

        <path d={arcPath(ARC_START, ARC_START + ARC_TOTAL, R)}
          fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round"/>

        {[[0,.2,"#22c55e"],[.2,.4,"#eab308"],[.4,.6,"#f97316"],[.6,.8,"#ef4444"],[.8,1,"#a855f7"]]
          .map(([f,t,c]) => (
            <path key={f}
              d={arcPath(ARC_START + f*ARC_TOTAL, ARC_START + t*ARC_TOTAL, R)}
              fill="none" stroke={c+"33"} strokeWidth="16" strokeLinecap="round"/>
          ))}

        <path ref={arcRef} fill="none" strokeWidth="16" strokeLinecap="round"
          style={{ transition: "d 0.9s cubic-bezier(.34,1.56,.64,1), stroke 0.4s" }}/>

        {[0,.2,.4,.6,.8,1].map(t => {
          const a = pt(ARC_START + t*ARC_TOTAL, R-9);
          const b = pt(ARC_START + t*ARC_TOTAL, R-2);
          return <line key={t}
            x1={a.x.toFixed(2)} y1={a.y.toFixed(2)}
            x2={b.x.toFixed(2)} y2={b.y.toFixed(2)}
            stroke="#334155" strokeWidth="2" strokeLinecap="round"/>;
        })}

        <g ref={needleRef}
          transform={`rotate(${BASE_OFFSET}, ${CX}, ${CY})`}
          style={{ transition: "transform 0.9s cubic-bezier(.34,1.56,.64,1)" }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY-(R-4)}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1={CX} y1={CY} x2={CX} y2={CY+14}
            stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.35"/>
        </g>

        <circle cx={CX} cy={CY} r="8"   fill="#0a0f1a" stroke="white" strokeWidth="2.5"/>
        <circle cx={CX} cy={CY} r="3.5" fill="white"/>

        {/* Valeur : centre exact entre pivot (120) et haut de l'arc (38) = y 79 */}
        <text ref={valRef}
          x={CX} y={VAL_Y}
          textAnchor="middle" dominantBaseline="central"
          fontSize="36" fontWeight="700" fill="white"
          fontFamily="'Space Mono', monospace">
          {value}
        </text>

        <text x={minPt.x.toFixed(1)} y={minPt.y.toFixed(1)}
          fontSize="10" fill="#475569" textAnchor="middle" fontFamily="sans-serif">0</text>
        <text x={maxPt.x.toFixed(1)} y={maxPt.y.toFixed(1)}
          fontSize="10" fill="#475569" textAnchor="middle" fontFamily="sans-serif">500</text>

      </svg>
    </div>
  );
}
