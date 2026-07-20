# 🛍️ Anime Store — Inventario

App para manejar el inventario de una tienda de figuras de anime (pensada para El Salvador, precios en USD).

## ✨ Qué hace

- **📸 Identificar por foto con IA** — tomás una foto de la figura y la IA (Claude) llena nombre, personaje, anime, marca y categoría (waifu / husbando / otro). Podés corregir todo.
- **🎎 Inventario** — orden alfabético, por anime, por marca o por recientes; buscador; editar y borrar.
- **💵 Precio automático** — costo fijo de **$12** y precio de venta calculado según **marca, modelo y tamaño**, con **mínimo $25** (ajustado al mercado de El Salvador). También podés poner el precio a mano.
- **📊 Resumen** — cuántas figuras hay, cuánto llevás invertido, venta y ganancia potencial, promedio, y ventas reales.
- **👤 Clientes y pedidos** — nombre, número, dirección, departamento, municipio, **guía de envío** y qué pidió/pidieron cada cliente.
- **📈 Analítica** — más vendidas, menos vendidas, ventas por categoría (waifus vs husbandos) y una **recomendación con IA** de qué traer más.
- **📄 Exportar a CSV** — inventario, clientes y pedidos.

## 🧠 Nota sobre los datos

Los datos se guardan en el **navegador** (localStorage), así que la app funciona sin base de datos y sin costo extra. Son por dispositivo/navegador — usá el botón **CSV** para respaldar. (Si más adelante querés que se sincronice entre teléfonos, se le puede agregar una base de datos como Vercel Postgres.)

## 🚀 Cómo subirla a Vercel

1. Este repo ya está listo. En [vercel.com](https://vercel.com) → **Add New… → Project** → importá este repositorio de GitHub.
2. Framework: **Next.js** (se detecta solo). Dale **Deploy**.
3. Para que funcione la identificación por foto y el análisis con IA, agregá la variable de entorno:
   - **Settings → Environment Variables**
   - `ANTHROPIC_API_KEY` = tu clave de Anthropic (se saca en <https://console.anthropic.com/> → API Keys).
   - **Redeploy** después de agregarla.

> Sin la clave, todo el inventario/clientes/CSV funciona igual; solo la foto-IA y el análisis mostrarán un aviso.

## 💻 Correr en local

```bash
npm install
cp .env.example .env.local   # y pegá tu ANTHROPIC_API_KEY
npm run dev
```

Abrí <http://localhost:3000>.

## 🔧 Ajustar precios

Los multiplicadores de marca y tamaño están en `lib/constants.ts` (`BRAND_MULTIPLIERS`, `SIZES`). Cambiá esos números y el precio automático se recalcula.

## 🛠️ Tecnología

Next.js (App Router) · React · TypeScript · Claude API (visión + análisis).
