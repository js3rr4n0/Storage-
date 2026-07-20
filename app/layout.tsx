import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Anime Store — Inventario",
  description:
    "Manejo de inventario de figuras de anime: identifica por foto con IA, precios automaticos, clientes y analitica.",
};

export const viewport: Viewport = {
  themeColor: "#0f1120",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
