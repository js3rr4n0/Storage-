export type Category = "waifu" | "husbando" | "otro";

export interface Figure {
  id: string;
  name: string; // nombre de la figura / edición
  character: string; // personaje
  anime: string;
  brand: string; // marca / fabricante
  series: string; // linea o serie (ej. POP UP PARADE, Nendoroid)
  size: string; // clave de tamaño (ver SIZES)
  category: Category; // waifu / husbando / otro
  cost: number; // precio de costo
  price: number; // precio de venta
  quantity: number; // cantidad en inventario
  image?: string; // miniatura en dataURL
  notes?: string;
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  department: string;
  municipality: string;
  createdAt: number;
}

export type OrderStatus =
  | "pendiente"
  | "pagado"
  | "enviado"
  | "entregado"
  | "cancelado";

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  figureId?: string;
  figureName: string;
  quantity: number;
  unitPrice: number;
  guia: string; // guia de envio
  status: OrderStatus;
  createdAt: number;
}

export interface AppData {
  figures: Figure[];
  clients: Client[];
  orders: Order[];
}

export interface IdentifyResult {
  name: string;
  character: string;
  anime: string;
  brand: string;
  series: string;
  size: string;
  category: Category;
  confidence: number;
  notes?: string;
}
