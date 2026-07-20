"use client";

import React, { useState } from "react";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Dona (anillo) para composicion. Muestra total al centro; al pasar el
 *  mouse/dedo por un segmento, muestra ese valor. */
export function Donut({
  data,
  size = 168,
  thickness = 24,
  centerUnit,
  fmt = (n: number) => String(n),
}: {
  data: Segment[];
  size?: number;
  thickness?: number;
  centerUnit?: string;
  fmt?: (n: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = data.filter((d) => d.value > 0).length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = data.map((d, i) => {
    const frac = total > 0 ? d.value / total : 0;
    const len = Math.max(0, frac * c - gap);
    const el = (
      <circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={d.color}
        strokeWidth={thickness}
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
        onMouseEnter={() => setActive(i)}
        onMouseLeave={() => setActive(null)}
        style={{
          cursor: "pointer",
          opacity: active === null || active === i ? 1 : 0.3,
          transition: "opacity .15s",
        }}
      >
        <title>
          {d.label}: {fmt(d.value)}
        </title>
      </circle>
    );
    offset += frac * c;
    return el;
  });

  const shown = active != null ? data[active] : null;
  const pct = shown && total > 0 ? Math.round((shown.value / total) * 100) : null;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={thickness}
        />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>{arcs}</g>
      </svg>
      <div className="donut-center">
        <div className="donut-value">
          {shown ? fmt(shown.value) : fmt(total)}
          {centerUnit ? <span className="donut-unit">{centerUnit}</span> : null}
        </div>
        <div className="donut-label">
          {shown ? `${shown.label}${pct != null ? ` · ${pct}%` : ""}` : "total"}
        </div>
      </div>
    </div>
  );
}

/** Leyenda: punto de color + etiqueta + valor (texto en tinta, no de color). */
export function Legend({
  data,
  fmt = (n: number) => String(n),
}: {
  data: Segment[];
  fmt?: (n: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="legend">
      {data.map((d, i) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div className="legend-item" key={i}>
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-val">
              {fmt(d.value)} <span className="muted">· {pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Barra apilada horizontal (composicion de una cantidad). */
export function StackedBar({
  segments,
  fmt = (n: number) => String(n),
}: {
  segments: Segment[];
  fmt?: (n: number) => string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="sbar">
        {segments.map((s, i) =>
          s.value > 0 ? (
            <div
              key={i}
              className="sbar-seg"
              style={{ flexGrow: s.value, background: s.color }}
              title={`${s.label}: ${fmt(s.value)}`}
            />
          ) : null
        )}
      </div>
      <div className="legend" style={{ marginTop: 12 }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div className="legend-item" key={i}>
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-val">
                {fmt(s.value)} <span className="muted">· {pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Ranking de barras horizontales (una sola serie, ordenada por magnitud). */
export function BarList({
  items,
  color = "var(--vermilion)",
  fmt = (n: number) => String(n),
}: {
  items: { label: string; value: number }[];
  color?: string;
  fmt?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bars">
      {items.map((it, i) => (
        <div className="bar-row" key={i} title={`${it.label}: ${fmt(it.value)}`}>
          <span className="lbl">{it.label}</span>
          <span className="bar-track">
            <span
              className="bar-fill"
              style={{ width: `${(it.value / max) * 100}%`, background: color }}
            />
          </span>
          <span className="val">{fmt(it.value)}</span>
        </div>
      ))}
    </div>
  );
}
