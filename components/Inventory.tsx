"use client";

import React, { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Figure, Category, IdentifyResult } from "@/lib/types";
import { CATEGORIES, SIZES, BRANDS, BASE_COST } from "@/lib/constants";
import { formatMoney, suggestPrice } from "@/lib/pricing";
import { toCSV, downloadCSV } from "@/lib/csv";
import { fileToResizedDataURL, splitDataURL } from "@/lib/image";
import FigureForm, { FigureDraft } from "./FigureForm";

type SortKey = "name" | "anime" | "brand" | "recent";

const sizeLabel = (k: string) => SIZES.find((s) => s.key === k)?.label || k;
const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)?.label || k;

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s: string) => norm(s).split(" ").filter((t) => t.length > 2);

// Puntua que tan parecida es una figura del inventario a lo identificado por la IA.
function scoreMatch(r: IdentifyResult, f: Figure): number {
  let score = 0;
  const rc = norm(r.character);
  const fc = norm(f.character);
  if (rc && fc && (fc.includes(rc) || rc.includes(fc))) score += 3;
  const ra = norm(r.anime);
  const fa = norm(f.anime);
  if (ra && fa && (fa.includes(ra) || ra.includes(fa))) score += 2;
  const rset = new Set(tokens(`${r.name} ${r.character}`));
  const overlap = tokens(`${f.name} ${f.character}`).filter((t) => rset.has(t)).length;
  score += Math.min(2, overlap);
  if (norm(r.brand) && norm(r.brand) === norm(f.brand)) score += 0.5;
  return score;
}

function resultToDraft(r: IdentifyResult, image: string): FigureDraft {
  const brand = BRANDS.includes(r.brand) ? r.brand : BRANDS[BRANDS.length - 1];
  const size = SIZES.some((s) => s.key === r.size) ? r.size : "prize";
  const category: Category = (["waifu", "husbando", "otro"].includes(r.category)
    ? r.category
    : "waifu") as Category;
  return {
    name: r.name || "",
    character: r.character || "",
    anime: r.anime || "",
    brand,
    series: r.series || "",
    size,
    category,
    cost: BASE_COST,
    price: suggestPrice(brand, size, BASE_COST),
    quantity: 1,
    image,
    notes: r.notes ? `IA (${Math.round((r.confidence || 0) * 100)}%): ${r.notes}` : "",
  };
}

interface ImgSearch {
  result: IdentifyResult;
  image: string;
  matches: Figure[];
}

export default function Inventory() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [editing, setEditing] = useState<Figure | null>(null);
  const [prefill, setPrefill] = useState<FigureDraft | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [searching, setSearching] = useState(false);
  const [imgSearch, setImgSearch] = useState<ImgSearch | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchFileRef = useRef<HTMLInputElement>(null);

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

  async function handleSearchFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSearchError(null);
    setSearching(true);
    setImgSearch(null);
    try {
      const dataURL = await fileToResizedDataURL(file, 640, 0.75);
      const { mediaType, data } = splitDataURL(dataURL);
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al identificar");
      const r = json as IdentifyResult;
      const matches = store.figures
        .map((f) => ({ f, s: scoreMatch(r, f) }))
        .filter((x) => x.s >= 3)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.f);
      setImgSearch({ result: r, image: dataURL, matches });
    } catch (err: any) {
      setSearchError(err?.message || "No se pudo identificar la foto");
    } finally {
      setSearching(false);
      if (searchFileRef.current) searchFileRef.current.value = "";
    }
  }

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

  const shownFigures = imgSearch ? imgSearch.matches : figures;

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div className="row" style={{ flex: 1, minWidth: 200 }}>
          <input
            placeholder="Buscar figura, personaje, anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            disabled={!!imgSearch}
          />
        </div>
        <button
          className="btn"
          onClick={() => searchFileRef.current?.click()}
          disabled={searching}
          title="Toma una foto y busca si ya la tienes"
        >
          {searching ? (
            <>
              <span className="spinner" /> Buscando...
            </>
          ) : (
            <>🔍📷 Buscar por foto</>
          )}
        </button>
        <input
          ref={searchFileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-file"
          onChange={handleSearchFile}
        />
        <button
          className="btn primary"
          onClick={() => {
            setEditing(null);
            setPrefill(null);
            setShowForm(true);
          }}
        >
          + Agregar
        </button>
      </div>

      {searchError && (
        <div className="note" style={{ marginBottom: 12 }}>
          {searchError}
        </div>
      )}

      {imgSearch && (
        <div className="card imgsearch" style={{ marginBottom: 14 }}>
          <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="imgsearch-thumb" src={imgSearch.image} alt="busqueda" />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                La IA identifico
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>
                {imgSearch.result.character || imgSearch.result.name || "Figura"}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {imgSearch.result.anime} · {imgSearch.result.brand}
              </div>
              {imgSearch.matches.length > 0 ? (
                <div
                  style={{ marginTop: 8, color: "var(--matcha)", fontWeight: 700 }}
                >
                  ✅ Ya la tienes — {imgSearch.matches.length} coincidencia
                  {imgSearch.matches.length > 1 ? "s" : ""}
                </div>
              ) : (
                <div style={{ marginTop: 8, color: "var(--vermilion-deep)", fontWeight: 700 }}>
                  ❌ No esta en tu inventario todavia
                </div>
              )}
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {imgSearch.matches.length === 0 && (
              <button
                className="btn primary sm"
                onClick={() => {
                  setPrefill(resultToDraft(imgSearch.result, imgSearch.image));
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                + Agregar esta figura
              </button>
            )}
            <button className="btn sm" onClick={() => setImgSearch(null)}>
              Limpiar busqueda
            </button>
          </div>
        </div>
      )}

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
            disabled={!!imgSearch}
          >
            {label}
          </button>
        ))}
        <button className="btn sm ghost" onClick={exportCSV} style={{ marginLeft: "auto" }}>
          ⬇ CSV
        </button>
      </div>

      {shownFigures.length === 0 ? (
        <div className="empty">
          {imgSearch
            ? "Ninguna figura del inventario coincide con esa foto."
            : store.figures.length === 0
            ? "No hay figuras todavia. Toca + Agregar y tomale una foto a tu primera figura 🎎"
            : "No se encontraron figuras con esa busqueda."}
        </div>
      ) : (
        <div className="fig-grid">
          {shownFigures.map((f) => (
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
                      setPrefill(null);
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
          prefill={prefill || undefined}
          onClose={() => setShowForm(false)}
          onSave={(draft) => {
            if (editing) store.updateFigure(editing.id, draft);
            else store.addFigure(draft);
            setShowForm(false);
            setPrefill(null);
            setImgSearch(null);
          }}
        />
      )}
    </div>
  );
}
