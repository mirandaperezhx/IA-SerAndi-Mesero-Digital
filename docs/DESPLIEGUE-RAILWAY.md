# Despliegue en Railway (con Sheila IA real vía Gemini)

Esta guía publica Ventum en una URL pública para probar los QR desde el celular
y hacer la demo, con **Sheila usando Google Gemini de verdad**.

## Arquitectura
- Un único servicio en Railway corre un servidor **Express** (`SGP/SGP/server.js`).
- El servidor hace dos cosas:
  1. Sirve el frontend compilado (`dist/`).
  2. Expone `POST /api/sheila`, un **proxy seguro** a Gemini.
- La `GEMINI_API_KEY` vive **solo en el servidor** (variable de entorno).
  Nunca llega al navegador → cumple la parte de ética/seguridad.
- Si la key falta o Gemini falla, Sheila cae sola al **motor local** (no se rompe).

## Paso 1 — Conseguir la API key de Gemini (gratis)
1. Entra a https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google.
3. **Create API key** → cópiala (empieza por `AIza...`).

## Paso 2 — Crear el proyecto en Railway
1. Entra a https://railway.app y **New Project → Deploy from GitHub repo**.
2. Selecciona el repositorio `ia-serandi-mesero-digital`.
3. En **Settings → Root Directory** escribe: `SGP/SGP`
   (¡importante! el proyecto vive en esa subcarpeta).
4. Railway detecta Node con Nixpacks y usa:
   - Build: `npm run build`
   - Start: `npm start` (arranca `server.js`)

## Paso 3 — Configurar variables de entorno
En Railway → pestaña **Variables**, agrega:

| Variable | Valor |
|---|---|
| `GEMINI_API_KEY` | tu key `AIza...` |
| `GEMINI_MODEL` | `gemini-2.0-flash` (opcional) |

No necesitas nada más: la app corre en modo mock (sin base de datos externa).

## Paso 4 — Generar el dominio público
1. Railway → **Settings → Networking → Generate Domain**.
2. Te da una URL tipo `https://ventum-production.up.railway.app`.

## Paso 5 — Probar
- Abre la URL en el computador y en el celular (funciona en cualquier red).
- **QR:** entra como admin (`/login`, PIN `2580`) → pestaña **QR**. Los QR
  apuntan a la URL pública, así que al escanearlos desde el celular abren el menú.
- **Sheila:** abre la burbuja y escribe *"soy alérgico al huevo, ¿qué puedo comer?"*.
  Ahora responde con Gemini (lenguaje más natural), manteniendo el filtrado de
  alergias del motor determinista para seguridad.

## Verificar que Gemini está activo
En los logs de Railway al arrancar verás:
```
Ventum escuchando en puerto XXXX
Sheila IA (Gemini): ACTIVA · gemini-2.0-flash
```
Si dice `inactiva (motor local)`, revisa que `GEMINI_API_KEY` esté bien puesta.

## Prueba local del servidor de producción (opcional)
```bash
cd SGP/SGP
npm install
npm run build
# Windows PowerShell:
$env:GEMINI_API_KEY="AIza..."; npm start
# macOS/Linux:
GEMINI_API_KEY=AIza... npm start
```
Abre http://localhost:3000
