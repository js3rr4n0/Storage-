"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Figure } from "@/lib/types";
import { CATEGORIES, SIZES } from "@/lib/constants";
import { formatMoney } from "@/lib/pricing";
import { toCSV, downloadCSV } from "@/lib/csv";
import FigureForm from "./FigureForm";

type SortKey = "name" | "anime" | "brand" | "recent";

const sizeLabel = (k: string) => SIZES.find((s) => s.key === k)?.label || k;
const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)?.label || k;

export default function Inventory() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [editing, setEditing] = useState<Figure | null>(null);
  const [showForm, setShowForm] = useState(false);

  const figures = useMemo(() => {
    let list = [...store.figures];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((f) =>
        [f.name, f.character, f.anime, f.brand, f.series]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sort) {
        case "anime":
          return a.anime.localeCompare(b.anime) || a.name.localeCompare(b.name);
        case "brand":
          return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
        case "recent":
          return b.createdAt - a.createdAt;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [store.figures, query, sort]);

  function exportCSV() {
    const headers = [
      "Nombre",
      "Personaje",
      "Anime",
      "Marca",
      "Linea",
      "Tamano",
      "Categoria",
      "Costo",
      "Precio",
      "Cantidad",
    ];
    const rows = store.figures.map((f) => [
      f.name,
      f.character,
      f.anime,
      f.brand,
      f.series,
      sizeLabel(f.size),
      catLabel(f.category),
      f.cost,
      f.price,
      f.quantity,
    ]);
    downloadCSV("inventario.csv", toCSV(headers, rows));
  }

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div className="row" style={{ flex: 1, minWidth: 220 }}>
          <input
            placeholder="Buscar figura, personaje, anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <button
          className="btn primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Agregar
        </button>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 13 }}>
          Ordenar:
        </span>
        {(
          [
            ["name", "A-Z"],
            ["anime", "Por anime"],
            ["brand", "Por marca"],
            ["recent", "Recientes"],
          ] as [SortKey, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            className={"btn sm" + (sort === k ? " primary" : "")}
            onClick={() => setSort(k)}
          >
            {label}
          </button>
        ))}
        <button className="btn sm ghost" onClick={exportCSV} style={{ marginLeft: "auto" }}>
          ⬇ CSV
        </button>
      </div>

      {figures.length === 0 ? (
        <div className="empty">
          No hay figuras todavia. Toca <b>+ Agregar</b> y tomale una foto a tu
          primera figura 🎎
        </div>
      ) : (
        <div className="fig-grid">
          {figures.map((f) => (
            <div className="fig" key={f.id}>
              {f.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={f.image} alt={f.name} />
              ) : (
                <div className="thumb placeholder">🎎</div>
              )}
              <div className="body">
                <div className="name">{f.name || f.character || "Sin nombre"}</div>
                <div className="meta">
                  {f.character && <>{f.character} · </>}
                  {f.anime || "—"}
                </div>
                <div className="meta">
                  {f.brand} · {sizeLabel(f.size).split(" (")[0]}
                </div>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  <span className={"badge " + f.category}>
                    {catLabel(f.category).split(" ")[0]}
                  </span>
                  <span className="pill-qty">x{f.quantity}</span>
                </div>
                <div className="price">{formatMoney(f.price)}</div>
                <div className="muted" style={{ fontSize: 11 }}>
                  costo {formatMoney(f.cost)}
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setEditing(f);
                      setShowForm(true);
                    }}
                  >
                    ✎ Editar
                  </button>
                  <button
                    className="btn sm danger"
                    onClick={() => {
                      if (confirm("Eliminar esta figura?")) store.deleteFigure(f.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FigureForm
          initial={editing || undefined}
          onClose={() => setShowForm(false)}
          onSave={(draft) => {
            if (editing) store.updateFigure(editing.id, draft);
            else store.addFigure(draft);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
