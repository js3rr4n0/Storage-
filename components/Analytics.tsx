"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { formatMoney } from "@/lib/pricing";
import { Donut, Legend, BarList, Segment } from "./Charts";

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

    const byProduct: Record<string, Ranked> = {};
    for (const o of soldOrders) {
      const key = o.figureName.toLowerCase();
      (byProduct[key] ||= { name: o.figureName, units: 0, revenue: 0 });
      byProduct[key].units += o.quantity;
      byProduct[key].revenue += o.quantity * o.unitPrice;
    }
    const ranked = Object.values(byProduct).sort((a, b) => b.units - a.units);

    const figById = new Map(store.figures.map((f) => [f.id, f]));
    const catUnits: Record<string, number> = { waifu: 0, husbando: 0, otro: 0 };
    for (const o of soldOrders) {
      const f = o.figureId ? figById.get(o.figureId) : undefined;
      const cat = f?.category || "otro";
      catUnits[cat] += o.quantity;
    }

    const invByAnime: Record<string, number> = {};
    const invByBrand: Record<string, number> = {};
    for (const f of store.figures) {
      invByAnime[f.anime || "—"] = (invByAnime[f.anime || "—"] || 0) + f.quantity;
      invByBrand[f.brand] = (invByBrand[f.brand] || 0) + f.quantity;
    }

    const topAnime = Object.entries(invByAnime)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const topBrand = Object.entries(invByBrand)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { ranked, catUnits, invByAnime, invByBrand, topAnime, topBrand, soldOrders };
  }, [store.orders, store.figures]);

  const catData: Segment[] = CATEGORIES.map((c) => ({
    label: c.label.split(" ")[0],
    value: data.catUnits[c.key] || 0,
    color: CATEGORY_COLORS[c.key],
  }));
  const hasSales = data.ranked.length > 0;
  const hasCatSales = catData.some((d) => d.value > 0);

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
      {hasSales ? (
        <>
          <div className="section-title">Mas vendidas</div>
          <div className="card">
            <BarList items={data.ranked.slice(0, 8).map((r) => ({ label: r.name, value: r.units }))} />
          </div>

          {data.ranked.length > 3 && (
            <>
              <div className="section-title">Menos vendidas</div>
              <div className="card">
                <BarList
                  items={data.ranked
                    .slice(-4)
                    .reverse()
                    .map((r) => ({ label: r.name, value: r.units }))}
                  color="#b3a894"
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div className="empty">
          Registra pedidos en la pestana <b>Clientes</b> para ver que se vende mas.
        </div>
      )}

      <div className="section-title">Ventas por categoria</div>
      <div className="card">
        {hasCatSales ? (
          <div className="chart-flex">
            <Donut data={catData} centerUnit=" u." />
            <Legend data={catData} />
          </div>
        ) : (
          <div className="empty" style={{ padding: 24 }}>
            Aun no hay ventas registradas por categoria.
          </div>
        )}
      </div>

      <div className="chart-row">
        <div className="card">
          <div className="card-title">Inventario por anime</div>
          {data.topAnime.length ? (
            <BarList items={data.topAnime} color="var(--indigo)" />
          ) : (
            <div className="empty" style={{ padding: 20 }}>Sin figuras.</div>
          )}
        </div>
        <div className="card">
          <div className="card-title">Inventario por marca</div>
          {data.topBrand.length ? (
            <BarList items={data.topBrand} color="var(--gold)" />
          ) : (
            <div className="empty" style={{ padding: 20 }}>Sin figuras.</div>
          )}
        </div>
      </div>

      <div className="section-title">Recomendacion con IA</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          La IA analiza tus ventas e inventario y te dice que traer mas, que evitar, y si
          vendes mas waifus o husbandos.
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
          <div className="note" style={{ marginTop: 12 }}>
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
