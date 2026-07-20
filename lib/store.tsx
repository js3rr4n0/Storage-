"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AppData, Figure, Client, Order } from "./types";

const empty: AppData = { figures: [], clients: [], orders: [] };

interface StoreContextValue extends AppData {
  loaded: boolean;
  error: string | null;
  reload: () => void;
  addFigure: (f: Omit<Figure, "id" | "createdAt">) => Promise<void>;
  updateFigure: (id: string, patch: Partial<Figure>) => Promise<void>;
  deleteFigure: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOrder: (o: Omit<Order, "id" | "createdAt">) => Promise<void>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "Error de base de datos";
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json().catch(() => ({}));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(empty);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const state = (await api("/api/state", "GET")) as AppData;
      setData({
        figures: state.figures ?? [],
        clients: state.clients ?? [],
        orders: state.orders ?? [],
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar la base de datos");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function fail(e: any) {
    const msg = e?.message || "Error";
    setError(msg);
    alert("No se pudo guardar: " + msg);
    reload();
  }

  // ---- Figures ----
  const addFigure = useCallback(
    async (f: Omit<Figure, "id" | "createdAt">) => {
      const full: Figure = { ...f, id: uid(), createdAt: Date.now() };
      setData((d) => ({ ...d, figures: [...d.figures, full] }));
      try {
        await api("/api/figures", "POST", full);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const updateFigure = useCallback(
    async (id: string, patch: Partial<Figure>) => {
      let merged: Figure | undefined;
      setData((d) => ({
        ...d,
        figures: d.figures.map((f) => {
          if (f.id === id) {
            merged = { ...f, ...patch };
            return merged;
          }
          return f;
        }),
      }));
      try {
        if (merged) await api(`/api/figures/${id}`, "PATCH", merged);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const deleteFigure = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, figures: d.figures.filter((f) => f.id !== id) }));
      try {
        await api(`/api/figures/${id}`, "DELETE");
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  // ---- Clients ----
  const addClient = useCallback(
    async (c: Omit<Client, "id" | "createdAt">) => {
      const full: Client = { ...c, id: uid(), createdAt: Date.now() };
      setData((d) => ({ ...d, clients: [...d.clients, full] }));
      try {
        await api("/api/clients", "POST", full);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const updateClient = useCallback(
    async (id: string, patch: Partial<Client>) => {
      let merged: Client | undefined;
      setData((d) => ({
        ...d,
        clients: d.clients.map((c) => {
          if (c.id === id) {
            merged = { ...c, ...patch };
            return merged;
          }
          return c;
        }),
      }));
      try {
        if (merged) await api(`/api/clients/${id}`, "PATCH", merged);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      setData((d) => ({
        ...d,
        clients: d.clients.filter((c) => c.id !== id),
        orders: d.orders.filter((o) => o.clientId !== id),
      }));
      try {
        await api(`/api/clients/${id}`, "DELETE");
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  // ---- Orders ----
  const addOrder = useCallback(
    async (o: Omit<Order, "id" | "createdAt">) => {
      const full: Order = { ...o, id: uid(), createdAt: Date.now() };
      setData((d) => ({ ...d, orders: [full, ...d.orders] }));
      try {
        await api("/api/orders", "POST", full);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const updateOrder = useCallback(
    async (id: string, patch: Partial<Order>) => {
      let merged: Order | undefined;
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) => {
          if (o.id === id) {
            merged = { ...o, ...patch };
            return merged;
          }
          return o;
        }),
      }));
      try {
        if (merged) await api(`/api/orders/${id}`, "PATCH", merged);
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      setData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
      try {
        await api(`/api/orders/${id}`, "DELETE");
      } catch (e) {
        fail(e);
      }
    },
    [reload]
  );

  const value: StoreContextValue = {
    ...data,
    loaded,
    error,
    reload,
    addFigure,
    updateFigure,
    deleteFigure,
    addClient,
    updateClient,
    deleteClient,
    addOrder,
    updateOrder,
    deleteOrder,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
