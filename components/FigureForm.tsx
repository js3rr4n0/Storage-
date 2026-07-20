"use client";

import React, { useRef, useState } from "react";
import { Figure, Category, IdentifyResult } from "@/lib/types";
import { BRANDS, SIZES, CATEGORIES, BASE_COST } from "@/lib/constants";
import { suggestPrice } from "@/lib/pricing";
import { fileToResizedDataURL, splitDataURL } from "@/lib/image";

type FigureDraft = Omit<Figure, "id" | "createdAt">;

function blank(): FigureDraft {
  return {
    name: "",
    character: "",
    anime: "",
    brand: BRANDS[BRANDS.length - 1],
    series: "",
    size: "prize",
    category: "waifu",
    cost: BASE_COST,
    price: suggestPrice(BRANDS[BRANDS.length - 1], "prize", BASE_COST),
    quantity: 1,
    image: undefined,
    notes: "",
  };
}

export default function FigureForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Figure;
  onSave: (draft: FigureDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<FigureDraft>(
    initial
      ? { ...initial }
      : blank()
  );
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoPrice, setAutoPrice] = useState(!initial);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FigureDraft>(key: K, value: FigureDraft[K]) {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (autoPrice && (key === "brand" || key === "size" || key === "cost")) {
        next.price = suggestPrice(next.brand, next.size, next.cost);
      }
      return next;
    });
  }

  function recalcPrice() {
    setDraft((d) => ({ ...d, price: suggestPrice(d.brand, d.size, d.cost) }));
    setAutoPrice(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataURL = await fileToResizedDataURL(file, 640, 0.75);
      setDraft((d) => ({ ...d, image: dataURL }));
      await identify(dataURL);
    } catch (err: any) {
      setError(err?.message || "No se pudo procesar la imagen");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function identify(dataURL: string) {
    setIdentifying(true);
    setError(null);
    try {
      const { mediaType, data } = splitDataURL(dataURL);
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al identificar");
      const r = json as IdentifyResult;
      setDraft((d) => {
        const brand = BRANDS.includes(r.brand) ? r.brand : d.brand;
        const size = SIZES.some((s) => s.key === r.size) ? r.size : d.size;
        const category: Category = (["waifu", "husbando", "otro"].includes(
          r.category
        )
          ? r.category
          : d.category) as Category;
        return {
          ...d,
          name: r.name || d.name,
          character: r.character || d.character,
          anime: r.anime || d.anime,
          brand,
          series: r.series || d.series,
          size,
          category,
          notes: r.notes ? `IA (${Math.round((r.confidence || 0) * 100)}%): ${r.notes}` : d.notes,
          price: autoPrice ? suggestPrice(brand, size, d.cost) : d.price,
        };
      });
    } catch (err: any) {
      setError(err?.message || "No se pudo identificar la figura");
    } finally {
      setIdentifying(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() && !draft.character.trim()) {
      setError("Ponle al menos un nombre o personaje.");
      return;
    }
    onSave(draft);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h3>{initial ? "Editar figura" : "Nueva figura"}</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          {draft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.image}
              alt="figura"
              style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid var(--border)",
              }}
            />
          ) : (
            <div
              className="fig thumb placeholder"
              style={{ width: 96, height: 96, borderRadius: 12 }}
            >
              🎎
            </div>
          )}
          <div style={{ flex: 1, minWidth: 160 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => fileRef.current?.click()}
              disabled={identifying}
            >
              {identifying ? (
                <>
                  <span className="spinner" /> Identificando...
                </>
              ) : (
                <>📸 Tomar / subir foto</>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden-file"
              onChange={handleFile}
            />
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
              La IA llena nombre, personaje, anime, marca y categoria. Puedes
              corregir todo abajo.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="note"
            style={{ borderColor: "var(--red)", color: "var(--red)", marginBottom: 10 }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 10 }}>
            <label className="field">Nombre de la figura</label>
            <input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Rem Wedding Ver."
            />
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Personaje</label>
              <input
                value={draft.character}
                onChange={(e) => set("character", e.target.value)}
                placeholder="Ej. Rem"
              />
            </div>
            <div>
              <label className="field">Anime / serie</label>
              <input
                value={draft.anime}
                onChange={(e) => set("anime", e.target.value)}
                placeholder="Ej. Re:Zero"
              />
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Marca</label>
              <select
                value={draft.brand}
                onChange={(e) => set("brand", e.target.value)}
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field">Linea / serie</label>
              <input
                value={draft.series}
                onChange={(e) => set("series", e.target.value)}
                placeholder="Ej. POP UP PARADE"
              />
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Tamano / modelo</label>
              <select value={draft.size} onChange={(e) => set("size", e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field">Categoria</label>
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Costo ($)</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={draft.cost}
                onChange={(e) => set("cost", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="field">Cantidad</label>
              <input
                type="number"
                min={0}
                step="1"
                value={draft.quantity}
                onChange={(e) => set("quantity", Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="field">
              Precio de venta ($){" "}
              {autoPrice ? (
                <span className="badge" style={{ color: "var(--green)" }}>
                  automatico
                </span>
              ) : (
                <span className="badge">manual</span>
              )}
            </label>
            <div className="row">
              <input
                type="number"
                min={0}
                step="0.5"
                value={draft.price}
                onChange={(e) => {
                  setAutoPrice(false);
                  setDraft((d) => ({ ...d, price: Number(e.target.value) }));
                }}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn sm" onClick={recalcPrice}>
                ⟳ Auto
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field">Notas</label>
            <textarea
              rows={2}
              value={draft.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div className="row spread">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn primary">
              💾 Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
