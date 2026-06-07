# Arquitectura · Ventum

## Stack
- **Frontend:** React 19 + TypeScript + Vite 8.
- **Estilos:** Tailwind CSS v4 (tokens de marca en `src/index.css`), tipografía Libre Baskerville.
- **Ruteo:** React Router 7.
- **Estado global:** React Context (`src/context/AppContext.tsx`) — sesión de mesa, carrito, rol de staff, último producto agregado.
- **Tiempo real:** capa `sgpApi` (`src/lib/supabase.ts`) con dos modos:
  - **Mock (por defecto):** `localStorage` + `BroadcastChannel` (`src/services/mockData.ts`). Cero backend, ideal para demo.
  - **Supabase (opcional):** Realtime Broadcast + Postgres (`supabase_schema.sql`).
- **IA:** motor local (`src/features/ai/`) + Claude `claude-haiku-4-5` opcional vía Edge Function (`supabase/functions/sheila`).
- **Extras:** `qrcode` (QR reales), `jsPDF` (lista de mandado), `canvas-confetti`, `lucide-react`.

## Flujo operativo

```
                 ┌─────────────┐
   Escanea QR →  │   CLIENTE   │  /menu  → /resumen → /status
                 │  (Sheila IA)│
                 └──────┬──────┘
                        │ enviar a cocina (placeOrder)
          broadcast: order_created          merma inventario
                        ▼
        ┌───────────────┴───────────────┬───────────────────┐
        ▼                               ▼                   ▼
 ┌────────────┐   status_changed  ┌────────────┐   order_created/…  ┌────────────┐
 │   COCINA   │ ───────────────►  │   MESERO   │                    │   ADMIN    │
 │ pending →  │  (sella tiempos)  │ ready →    │                    │ métricas + │
 │ preparing →│                   │ entregar → │                    │ inventario │
 │ ready      │                   │ cobrar     │  session_closed    │ + QR + PDF │
 └────────────┘                   └────────────┘ ──────────────►    └────────────┘
```

Eventos del canal `ventum_realtime` (mock) / Supabase Broadcast:
`order_created`, `status_changed`, `session_closed`, `inventory_changed`.

## Módulos clave
| Carpeta / archivo | Responsabilidad |
|---|---|
| `src/services/mockData.ts` | Menú, materia prima, recetas, pedidos, inventario y broadcast local |
| `src/lib/supabase.ts` | API unificada (mock/Supabase): menú, sesiones, pedidos, PIN, métricas |
| `src/features/ai/dietEngine.ts` | Alérgenos/dietas/maridajes/ofertas (determinista) |
| `src/features/ai/waitForecast.ts` | Pronóstico de espera que aprende por franja horaria |
| `src/features/ai/sheilaClient.ts` | Capa híbrida (local + Claude) |
| `src/features/ai/SheilaChat.tsx` / `PairingCarousel.tsx` | UI de la IA |
| `src/features/merchant/pages/AdminDashboard.tsx` | Inventario, métricas, mesas, QR, suscripción |
| `src/services/{qrService,shoppingListPdf}.ts` | QR reales y PDF de mandado |

## Datos
- 5 categorías × 3 productos (15 platos colombianos), cada uno con **receta** (consumo de ingredientes).
- ~45 ingredientes de materia prima en 7 grupos (frutas, verduras, legumbres, carnes, lácteos, bebidas, abarrotes).
- Alérgenos y etiquetas de dieta se **derivan** de la receta + catálogo de ingredientes (una sola fuente de verdad).
