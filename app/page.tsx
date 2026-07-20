"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import Dashboard from "@/components/Dashboard";
import Inventory from "@/components/Inventory";
import Clients from "@/components/Clients";
import Analytics from "@/components/Analytics";

type Tab = "dashboard" | "inventario" | "clientes" | "analitica";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Resumen", icon: "📊" },
  { key: "inventario", label: "Inventario", icon: "🎎" },
  { key: "clientes", label: "Clientes", icon: "👤" },
  { key: "analitica", label: "Analitica", icon: "📈" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { loaded } = useStore();

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">🛍️</span>
          <div>
            Anime Store
            <small>Inventario · El Salvador</small>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={"tab" + (tab === t.key ? " active" : "")}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {!loaded ? (
          <div className="empty">
            <span className="spinner" /> Cargando...
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard />}
            {tab === "inventario" && <Inventory />}
            {tab === "clientes" && <Clients />}
            {tab === "analitica" && <Analytics />}
          </>
        )}
      </main>
    </div>
  );
}
