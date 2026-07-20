"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { formatMoney } from "@/lib/pricing";

interface Ranked {
  name: string;
  units: number;
  revenue: number;
}

export default function Analytics() {
  const store = useStore();
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(() => {
    const soldOrders = store.orders.filter((o) => o.status !== "cancelado");

    // Ranking por producto
    const byProduct: Record<string, Ranked> = {};
    for (const o of soldOrders) {
      const key = o.figureName.toLowerCase();
      (byProduct[key] ||= { name: o.figureName, units: 0, revenue: 0 });
      byProduct[key].units += o.quantity;
      byProduct[key].revenue += o.quantity * o.unitPrice;
    }
    const ranked = Object.values(byProduct).sort((a, b) => b.units - a.units);

    // Categoria: relacionar pedido con figura para saber waifu/husbando
    const figById = new Map(store.figures.map((f) => [f.id, f]));
    const catUnits: Record<string, number> = { waifu: 0, husbando: 0, otro: 0 };
    for (const o of soldOrders) {
      const f = o.figureId ? figById.get(o.figureId) : undefined;
      const cat = f?.category || "otro";
      catUnits[cat] += o.quantity;
    }

    // Inventario por categoria/anime/marca
    const invByAnime: Record<string, number> = {};
    const invByBrand: Record<string, number> = {};
    for (const f of store.figures) {
      invByAnime[f.anime || "—"] = (invByAnime[f.anime || "—"] || 0) + f.quantity;
      invByBrand[f.brand] = (invByBrand[f.brand] || 0) + f.quantity;
    }

    return { ranked, catUnits, invByAnime, invByBrand, soldOrders };
  }, [store.orders, store.figures]);

  const maxUnits = Math.max(1, ...data.ranked.map((r) => r.units));
  const totalCat = data.catUnits.waifu + data.catUnits.husbando + data.catUnits.otro;

  async function runAI() {
    setLoading(true);
    setError(null);
    setAnalysis("");
    try {
      const summary = {
        totalFiguras: store.figures.length,
        totalPedidos: store.orders.length,
        masVendidas: data.ranked.slice(0, 8),
        menosVendidas: data.ranked.slice(-5).reverse(),
        ventasPorCategoria: data.catUnits,
        inventarioPorAnime: data.invByAnime,
        inventarioPorMarca: data.invByBrand,
      };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setAnalysis(json.analysis);
    } catch (e: any) {
      setError(e?.message || "No se pudo generar el analisis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">Mas vendidas</div>
      {data.ranked.length === 0 ? (
        <div className="empty">
          Registra pedidos en la pestana <b>Clientes</b> para ver que se vende
          mas.
        </div>
      ) : (
        <div className="card">
          <div className="bars">
            {data.ranked.slice(0, 8).map((r) => (
              <div className="bar-row" key={r.name}>
                <span className="lbl">{r.name}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${(r.units / maxUnits) * 100}%` }}
                  />
                </span>
                <span className="val">{r.units}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.ranked.length > 3 && (
        <>
          <div className="section-title">Menos vendidas</div>
          <div className="card">
            <div className="bars">
              {data.ranked
                .slice(-4)
                .reverse()
                .map((r) => (
                  <div className="bar-row" key={r.name}>
                    <span className="lbl">{r.name}</span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        style={{
                          width: `${(r.units / maxUnits) * 100}%`,
                          background: "linear-gradient(90deg,#555,#888)",
                        }}
                      />
                    </span>
                    <span className="val">{r.units}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      <div className="section-title">Ventas por categoria</div>
      <div className="stats">
        {CATEGORIES.map((c) => {
          const u = data.catUnits[c.key];
          const pct = totalCat > 0 ? Math.round((u / totalCat) * 100) : 0;
          return (
            <div className="stat" key={c.key}>
              <div className="label">{c.label}</div>
              <div
                className={
                  "value " +
                  (c.key === "waifu" ? "pink" : c.key === "husbando" ? "" : "amber")
                }
              >
                {u}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {pct}% de las ventas
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-title">Recomendacion con IA</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          La IA analiza tus ventas e inventario y te dice que traer mas, que
          evitar, y si vendes mas waifus o husbandos.
        </p>
        <button className="btn primary" onClick={runAI} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Analizando...
            </>
          ) : (
            <>🤖 Generar analisis</>
          )}
        </button>
        {error && (
          <div
            className="note"
            style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 12 }}
          >
            {error}
          </div>
        )}
        {analysis && (
          <div className="ai-box" style={{ marginTop: 14 }}>
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
}
