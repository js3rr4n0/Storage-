"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Client, Order, OrderStatus } from "@/lib/types";
import { DEPARTMENTS, ORDER_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/pricing";
import { toCSV, downloadCSV } from "@/lib/csv";

function ClientForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Client;
  onSave: (c: Omit<Client, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [c, setC] = useState<Omit<Client, "id" | "createdAt">>(
    initial
      ? {
          name: initial.name,
          phone: initial.phone,
          address: initial.address,
          department: initial.department,
          municipality: initial.municipality,
        }
      : {
          name: "",
          phone: "",
          address: "",
          department: DEPARTMENTS[5],
          municipality: "",
        }
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c.name.trim()) return;
    onSave(c);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h3>{initial ? "Editar cliente" : "Nuevo cliente"}</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 10 }}>
            <label className="field">Nombre</label>
            <input
              value={c.name}
              onChange={(e) => setC({ ...c, name: e.target.value })}
              placeholder="Nombre completo"
            />
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Numero / telefono</label>
              <input
                value={c.phone}
                onChange={(e) => setC({ ...c, phone: e.target.value })}
                placeholder="7000-0000"
              />
            </div>
            <div>
              <label className="field">Departamento</label>
              <select
                value={c.department}
                onChange={(e) => setC({ ...c, department: e.target.value })}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="field">Municipio</label>
            <input
              value={c.municipality}
              onChange={(e) => setC({ ...c, municipality: e.target.value })}
              placeholder="Municipio"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field">Direccion</label>
            <textarea
              rows={2}
              value={c.address}
              onChange={(e) => setC({ ...c, address: e.target.value })}
              placeholder="Direccion exacta para el envio"
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

function OrderForm({
  client,
  onSave,
  onClose,
}: {
  client: Client;
  onSave: (o: Omit<Order, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const store = useStore();
  const [figureId, setFigureId] = useState<string>("");
  const [figureName, setFigureName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [guia, setGuia] = useState("");
  const [status, setStatus] = useState<OrderStatus>("pendiente");

  function pickFigure(id: string) {
    setFigureId(id);
    const f = store.figures.find((x) => x.id === id);
    if (f) {
      setFigureName(f.name || f.character);
      setUnitPrice(f.price);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = figureName.trim() || "Producto";
    onSave({
      clientId: client.id,
      clientName: client.name,
      figureId: figureId || undefined,
      figureName: name,
      quantity,
      unitPrice,
      guia,
      status,
    });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h3>Pedido de {client.name}</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 10 }}>
            <label className="field">Figura del inventario</label>
            <select value={figureId} onChange={(e) => pickFigure(e.target.value)}>
              <option value="">— Escribir manual —</option>
              {store.figures.map((f) => (
                <option key={f.id} value={f.id}>
                  {(f.name || f.character) + " (" + formatMoney(f.price) + ")"}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="field">Que pidio</label>
            <input
              value={figureName}
              onChange={(e) => setFigureName(e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div>
              <label className="field">Cantidad</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="field">Precio unitario ($)</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 14 }}>
            <div>
              <label className="field">Guia de envio</label>
              <input
                value={guia}
                onChange={(e) => setGuia(e.target.value)}
                placeholder="No. de guia"
              />
            </div>
            <div>
              <label className="field">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row spread">
            <div className="muted">
              Total: <b>{formatMoney(quantity * unitPrice)}</b>
            </div>
            <button type="submit" className="btn primary">
              💾 Guardar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const store = useStore();
  const [showClient, setShowClient] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [orderFor, setOrderFor] = useState<Client | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ordersByClient = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const o of store.orders) {
      (map[o.clientId] ||= []).push(o);
    }
    return map;
  }, [store.orders]);

  function exportClientsCSV() {
    const headers = [
      "Nombre",
      "Numero",
      "Departamento",
      "Municipio",
      "Direccion",
      "Pedidos",
    ];
    const rows = store.clients.map((c) => [
      c.name,
      c.phone,
      c.department,
      c.municipality,
      c.address,
      (ordersByClient[c.id]?.length ?? 0).toString(),
    ]);
    downloadCSV("clientes.csv", toCSV(headers, rows));
  }

  function exportOrdersCSV() {
    const headers = [
      "Cliente",
      "Producto",
      "Cantidad",
      "Precio",
      "Total",
      "Guia",
      "Estado",
      "Fecha",
    ];
    const rows = store.orders.map((o) => [
      o.clientName,
      o.figureName,
      o.quantity,
      o.unitPrice,
      o.quantity * o.unitPrice,
      o.guia,
      o.status,
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    downloadCSV("pedidos.csv", toCSV(headers, rows));
  }

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Clientes y pedidos
        </div>
        <div className="row">
          <button className="btn sm ghost" onClick={exportClientsCSV}>
            ⬇ Clientes
          </button>
          <button className="btn sm ghost" onClick={exportOrdersCSV}>
            ⬇ Pedidos
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setShowClient(true);
            }}
          >
            + Cliente
          </button>
        </div>
      </div>

      {store.clients.length === 0 ? (
        <div className="empty">
          Aun no hay clientes. Agrega uno con <b>+ Cliente</b>.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {store.clients.map((c) => {
            const orders = ordersByClient[c.id] || [];
            const open = expanded === c.id;
            const total = orders
              .filter((o) => o.status !== "cancelado")
              .reduce((s, o) => s + o.unitPrice * o.quantity, 0);
            return (
              <div className="card" key={c.id}>
                <div className="row spread">
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      📞 {c.phone || "—"} · {c.municipality}, {c.department}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {c.address}
                    </div>
                  </div>
                  <div className="center">
                    <div style={{ fontWeight: 800, color: "var(--green)" }}>
                      {formatMoney(total)}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {orders.length} pedido(s)
                    </div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn sm primary"
                    onClick={() => setOrderFor(c)}
                  >
                    + Pedido
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => setExpanded(open ? null : c.id)}
                  >
                    {open ? "Ocultar" : "Ver pedidos"}
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setEditing(c);
                      setShowClient(true);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="btn sm danger"
                    onClick={() => {
                      if (confirm("Eliminar cliente y sus pedidos?")) {
                        orders.forEach((o) => store.deleteOrder(o.id));
                        store.deleteClient(c.id);
                      }
                    }}
                  >
                    🗑
                  </button>
                </div>

                {open && (
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    {orders.length === 0 ? (
                      <div className="muted center" style={{ padding: 12 }}>
                        Sin pedidos.
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cant</th>
                            <th>Total</th>
                            <th>Guia</th>
                            <th>Estado</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td>{o.figureName}</td>
                              <td>{o.quantity}</td>
                              <td>{formatMoney(o.unitPrice * o.quantity)}</td>
                              <td>{o.guia || "—"}</td>
                              <td>
                                <select
                                  value={o.status}
                                  onChange={(e) =>
                                    store.updateOrder(o.id, {
                                      status: e.target.value as OrderStatus,
                                    })
                                  }
                                  style={{ padding: "4px 6px", fontSize: 12 }}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s.key} value={s.key}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <button
                                  className="btn sm danger"
                                  onClick={() => store.deleteOrder(o.id)}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showClient && (
        <ClientForm
          initial={editing || undefined}
          onClose={() => setShowClient(false)}
          onSave={(c) => {
            if (editing) store.updateClient(editing.id, c);
            else store.addClient(c);
            setShowClient(false);
          }}
        />
      )}
      {orderFor && (
        <OrderForm
          client={orderFor}
          onClose={() => setOrderFor(null)}
          onSave={(o) => {
            store.addOrder(o);
            setOrderFor(null);
          }}
        />
      )}
    </div>
  );
}
