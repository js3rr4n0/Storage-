"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/pricing";

export default function Dashboard() {
  const store = useStore();

  const stats = useMemo(() => {
    const figs = store.figures;
    const totalUnits = figs.reduce((s, f) => s + f.quantity, 0);
    const invested = figs.reduce((s, f) => s + f.cost * f.quantity, 0);
    const potentialRevenue = figs.reduce((s, f) => s + f.price * f.quantity, 0);
    const potentialProfit = potentialRevenue - invested;
    const avgPrice =
      figs.length > 0
        ? figs.reduce((s, f) => s + f.price, 0) / figs.length
        : 0;

    // Ventas reales (pedidos no cancelados)
    const soldOrders = store.orders.filter((o) => o.status !== "cancelado");
    const realRevenue = soldOrders.reduce(
      (s, o) => s + o.unitPrice * o.quantity,
      0
    );
    const soldUnits = soldOrders.reduce((s, o) => s + o.quantity, 0);

    return {
      distinct: figs.length,
      totalUnits,
      invested,
      potentialRevenue,
      potentialProfit,
      avgPrice,
      realRevenue,
      soldUnits,
      orders: store.orders.length,
      clients: store.clients.length,
    };
  }, [store.figures, store.orders, store.clients]);

  return (
    <div>
      <div className="section-title">Inventario</div>
      <div className="stats">
        <div className="stat">
          <div className="label">Figuras distintas</div>
          <div className="value">{stats.distinct}</div>
        </div>
        <div className="stat">
          <div className="label">Total de unidades</div>
          <div className="value">{stats.totalUnits}</div>
        </div>
        <div className="stat">
          <div className="label">Invertido (costo)</div>
          <div className="value amber">{formatMoney(stats.invested)}</div>
        </div>
        <div className="stat">
          <div className="label">Precio promedio</div>
          <div className="value">{formatMoney(stats.avgPrice)}</div>
        </div>
      </div>

      <div className="section-title">Si se vende todo</div>
      <div className="stats">
        <div className="stat">
          <div className="label">Venta potencial</div>
          <div className="value green">{formatMoney(stats.potentialRevenue)}</div>
        </div>
        <div className="stat">
          <div className="label">Ganancia potencial</div>
          <div className="value green">{formatMoney(stats.potentialProfit)}</div>
        </div>
        <div className="stat">
          <div className="label">Margen</div>
          <div className="value">
            {stats.potentialRevenue > 0
              ? Math.round(
                  (stats.potentialProfit / stats.potentialRevenue) * 100
                ) + "%"
              : "—"}
          </div>
        </div>
      </div>

      <div className="section-title">Ventas reales</div>
      <div className="stats">
        <div className="stat">
          <div className="label">Ingresos por pedidos</div>
          <div className="value pink">{formatMoney(stats.realRevenue)}</div>
        </div>
        <div className="stat">
          <div className="label">Unidades vendidas</div>
          <div className="value">{stats.soldUnits}</div>
        </div>
        <div className="stat">
          <div className="label">Pedidos</div>
          <div className="value">{stats.orders}</div>
        </div>
        <div className="stat">
          <div className="label">Clientes</div>
          <div className="value">{stats.clients}</div>
        </div>
      </div>
    </div>
  );
}
