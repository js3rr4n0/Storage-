"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AppData, Figure, Client, Order } from "./types";

const STORAGE_KEY = "anime-store-inventory-v1";

const empty: AppData = { figures: [], clients: [], orders: [] };

interface StoreContextValue extends AppData {
  loaded: boolean;
  addFigure: (f: Omit<Figure, "id" | "createdAt">) => void;
  updateFigure: (id: string, patch: Partial<Figure>) => void;
  deleteFigure: (id: string) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addOrder: (o: Omit<Order, "id" | "createdAt">) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  replaceAll: (data: AppData) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        setData({
          figures: parsed.figures ?? [],
          clients: parsed.clients ?? [],
          orders: parsed.orders ?? [],
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("No se pudo guardar (posible almacenamiento lleno)", e);
    }
  }, [data, loaded]);

  const addFigure = useCallback((f: Omit<Figure, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      figures: [...d.figures, { ...f, id: uid(), createdAt: Date.now() }],
    }));
  }, []);

  const updateFigure = useCallback((id: string, patch: Partial<Figure>) => {
    setData((d) => ({
      ...d,
      figures: d.figures.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }, []);

  const deleteFigure = useCallback((id: string) => {
    setData((d) => ({ ...d, figures: d.figures.filter((f) => f.id !== id) }));
  }, []);

  const addClient = useCallback((c: Omit<Client, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      clients: [...d.clients, { ...c, id: uid(), createdAt: Date.now() }],
    }));
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
  }, []);

  const addOrder = useCallback((o: Omit<Order, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      orders: [...d.orders, { ...o, id: uid(), createdAt: Date.now() }],
    }));
  }, []);

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const value: StoreContextValue = {
    ...data,
    loaded,
    addFigure,
    updateFigure,
    deleteFigure,
    addClient,
    updateClient,
    deleteClient,
    addOrder,
    updateOrder,
    deleteOrder,
    replaceAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
