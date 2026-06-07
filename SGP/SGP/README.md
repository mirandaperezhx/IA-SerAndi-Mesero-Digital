# Ventum · App (técnico)

Frontend del mesero digital con IA. React 19 + Vite 8 + TypeScript + Tailwind v4.
Documentación completa del proyecto en el [README raíz](../../README.md) y en [`docs/`](../../docs).

## Requisitos
- Node 18+ y npm.

## Scripts
```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (modo mock por defecto)
npm run build    # typecheck + build de producción
npm run lint     # ESLint
npm run preview  # sirve el build
```

## Modos de ejecución
- **Mock (por defecto):** sin variables de entorno. Usa `localStorage` + `BroadcastChannel`. Todo funciona en la terminal.
- **Supabase (opcional):** define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver `.env.example`). Esquema en `supabase_schema.sql`.
- **Claude/Sheila (opcional):** define `VITE_AI_PROXY_URL` apuntando a la Edge Function `supabase/functions/sheila`. Sin esto, Sheila usa el motor local.

## Accesos de demo
- Cliente: escanear mesa → PIN de mesa (Mesa N = `100N`, p. ej. Mesa 1 = `1001`).
- Personal (`/login`): PIN único **2580** para mesero, cocina y admin.

## Estructura
```
src/
  context/AppContext.tsx        Estado global (sesión, carrito, rol)
  lib/supabase.ts               API unificada mock/Supabase
  services/
    mockData.ts                 Menú, inventario, recetas, pedidos, broadcast
    qrService.ts                QR reales (qrcode)
    shoppingListPdf.ts          Lista de mandado (jsPDF)
    notifications.ts            Sonidos + notificaciones
  features/
    ai/                         Sheila: dietEngine, waitForecast, sheilaClient, UI
    customer/pages/             QRLanding, CustomerMenu, Resumen, OrderStatus
    auth/pages/StaffLogin.tsx
    merchant/pages/             KitchenDashboard, WaiterDashboard, AdminDashboard
    merchant/components/SupplyBar.tsx
supabase/functions/sheila/      Edge Function (proxy a Claude, opcional)
supabase_schema.sql             Esquema + RLS + inventario + tiempos
```

## Notas
- Las imágenes de los platos son placeholders de Unsplash (reemplazables).
- El inventario y el pronóstico de espera persisten en `localStorage` en modo mock.
