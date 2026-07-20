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
  const { loaded, error } = useStore();

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="seal">ア</span>
          <div className="brand-text">
            <span className="kicker">フィギュア コレクション</span>
            <span className="wordmark">Anime Store</span>
            <span className="sub">Inventario · El Salvador</span>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={"tab" + (tab === t.key ? " active" : "")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && (
          <div
            className="note"
            style={{
              borderColor: "var(--red)",
              color: "var(--red)",
              marginBottom: 12,
            }}
          >
            ⚠️ {error}
          </div>
        )}
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
