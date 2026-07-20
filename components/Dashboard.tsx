"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/pricing";
import { CATEGORIES, CATEGORY_COLORS, MONEY_COLORS } from "@/lib/constants";
import { Donut, Legend, StackedBar, Segment } from "./Charts";

function Stat({
  icon,
  tint,
  label,
  value,
  accent,
}: {
  icon: string;
  tint: string;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="stat-h">
      <span className="stat-ico" style={{ background: tint }}>
        {icon}
      </span>
      <div className="stat-body">
        <div className="label">{label}</div>
        <div className="value" style={accent ? { color: accent } : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const store = useStore();

  const s = useMemo(() => {
    const figs = store.figures;
    const totalUnits = figs.reduce((a, f) => a + f.quantity, 0);
    const invested = figs.reduce((a, f) => a + f.cost * f.quantity, 0);
    const potentialRevenue = figs.reduce((a, f) => a + f.price * f.quantity, 0);
    const potentialProfit = potentialRevenue - invested;
    const avgPrice = figs.length ? figs.reduce((a, f) => a + f.price, 0) / figs.length : 0;

    const catUnits: Record<string, number> = { waifu: 0, husbando: 0, otro: 0 };
    for (const f of figs) catUnits[f.category] = (catUnits[f.category] || 0) + f.quantity;

    const soldOrders = store.orders.filter((o) => o.status !== "cancelado");
    const realRevenue = soldOrders.reduce((a, o) => a + o.unitPrice * o.quantity, 0);
    const soldUnits = soldOrders.reduce((a, o) => a + o.quantity, 0);

    return {
      distinct: figs.length,
      totalUnits,
      invested,
      potentialRevenue,
      potentialProfit,
      avgPrice,
      catUnits,
      realRevenue,
      soldUnits,
      orders: store.orders.length,
      clients: store.clients.length,
    };
  }, [store.figures, store.orders, store.clients]);

  const catData: Segment[] = CATEGORIES.map((c) => ({
    label: c.label.split(" ")[0],
    value: s.catUnits[c.key] || 0,
    color: CATEGORY_COLORS[c.key],
  }));
  const hasCats = catData.some((d) => d.value > 0);

  const moneyData: Segment[] = [
    { label: "Costo invertido", value: s.invested, color: MONEY_COLORS.cost },
    { label: "Ganancia potencial", value: Math.max(0, s.potentialProfit), color: MONEY_COLORS.profit },
  ];

  return (
    <div>
      <div className="section-title">Tu coleccion</div>
      <div className="stats">
        <Stat icon="🎎" tint="#fdeef1" label="Figuras distintas" value={s.distinct} />
        <Stat icon="📦" tint="#eef1fb" label="Total de unidades" value={s.totalUnits} />
        <Stat
          icon="💴"
          tint="#f7f0e3"
          label="Invertido (costo)"
          value={formatMoney(s.invested)}
          accent="var(--gold)"
        />
        <Stat icon="🏷️" tint="#f0f5ee" label="Precio promedio" value={formatMoney(s.avgPrice)} />
      </div>

      <div className="chart-row">
        <div className="card">
          <div className="card-title">Coleccion por categoria</div>
          {hasCats ? (
            <div className="chart-flex">
              <Donut data={catData} centerUnit=" figs" />
              <Legend data={catData} />
            </div>
          ) : (
            <div className="empty" style={{ padding: 24 }}>
              Agrega figuras para ver la distribucion.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Valor del inventario</div>
          {s.potentialRevenue > 0 ? (
            <>
              <div className="big-num">
                {formatMoney(s.potentialRevenue)}
                <span className="big-sub"> venta potencial</span>
              </div>
              <StackedBar segments={moneyData} fmt={formatMoney} />
              <div className="margin-note">
                Margen{" "}
                <b style={{ color: "var(--matcha)" }}>
                  {s.potentialRevenue > 0
                    ? Math.round((s.potentialProfit / s.potentialRevenue) * 100)
                    : 0}
                  %
                </b>{" "}
                si se vende todo
              </div>
            </>
          ) : (
            <div className="empty" style={{ padding: 24 }}>
              Sin datos de precios todavia.
            </div>
          )}
        </div>
      </div>

      <div className="section-title">Ventas reales</div>
      <div className="stats">
        <Stat
          icon="🧾"
          tint="#fdecef"
          label="Ingresos por pedidos"
          value={formatMoney(s.realRevenue)}
          accent="var(--rose)"
        />
        <Stat icon="🚚" tint="#eef1fb" label="Unidades vendidas" value={s.soldUnits} />
        <Stat icon="📮" tint="#f7f0e3" label="Pedidos" value={s.orders} />
        <Stat icon="👥" tint="#f0f5ee" label="Clientes" value={s.clients} />
      </div>
    </div>
  );
}
