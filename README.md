# 🛍️ Anime Store — Inventario

App para manejar el inventario de una tienda de figuras de anime (pensada para El Salvador, precios en USD).

## ✨ Qué hace

- **📸 Identificar por foto con IA (Google Gemini, gratis)** — tomás una foto y la IA llena nombre, personaje, anime, marca y categoría (waifu / husbando / otro). Todo editable.
- **🎎 Inventario** — orden alfabético, por anime, por marca o recientes; buscador; editar y borrar.
- **💵 Precio automático** — costo fijo de **$12** y precio de venta según **marca, modelo y tamaño**, con **mínimo $25** (mercado de El Salvador). También manual.
- **📊 Resumen** — figuras, invertido, venta y ganancia potencial, promedio, ventas reales.
- **👤 Clientes y pedidos** — nombre, número, dirección, departamento, municipio, **guía de envío** y qué pidió cada quien.
- **📈 Analítica** — más/menos vendidas, ventas por categoría (waifus vs husbandos) y **recomendación con IA**.
- **📄 Exportar a CSV** — inventario, clientes y pedidos.
- **☁️ Base de datos en la nube (Neon Postgres)** — los datos se **sincronizan entre todos tus dispositivos**.

## 🚀 Cómo subirla a Vercel (paso a paso)

### 1. Importar el proyecto
En [vercel.com](https://vercel.com) → **Add New… → Project** → importá este repo. Framework: **Next.js** (se detecta solo).

### 2. Conectar la base de datos Neon
Dos formas:

**A) Integración automática (recomendada):** en tu proyecto de Vercel → pestaña **Storage** → **Create Database → Neon** (o **Connect** si ya la tenés). Vercel crea y conecta la variable **`DATABASE_URL`** sola.

**B) Manual:** en **Settings → Environment Variables** agregá `DATABASE_URL` con tu connection string de Neon (el que empieza con `postgresql://...`, usá el **pooler**).

> Las tablas se crean solas la primera vez que abrís la app. No hay que correr SQL a mano.

### 3. Agregar la clave de Gemini (IA de fotos)
1. Andá a <https://aistudio.google.com/apikey> e iniciá sesión con tu cuenta de Google.
2. **Create API key** → copiala (es **gratis, sin tarjeta**).
3. En Vercel → **Settings → Environment Variables** → agregá `GEMINI_API_KEY` con esa clave.

### 4. Redeploy
Después de agregar las variables, **Deployments → … → Redeploy**. Listo. 🎉

> Sin `GEMINI_API_KEY` todo funciona igual, solo la foto-IA y el análisis muestran un aviso. Sin `DATABASE_URL` la app no puede guardar (necesita la base de datos).

## 💻 Correr en local

```bash
npm install
cp .env.example .env.local   # pegá tu DATABASE_URL y GEMINI_API_KEY
npm run dev
```

Abrí <http://localhost:3000>.

## 🔧 Ajustar precios

Los multiplicadores de marca y tamaño están en `lib/constants.ts` (`BRAND_MULTIPLIERS`, `SIZES`).

## 🛠️ Tecnología

Next.js (App Router) · React · TypeScript · Neon (Postgres serverless) · Google Gemini (visión + análisis).
