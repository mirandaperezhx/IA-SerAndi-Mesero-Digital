# 🍷 Ventum · Mesero Digital con IA

> Experiencia gastronómica inteligente: el comensal pide por QR, **Sheila** (IA) lo atiende y le sugiere según sus alergias/dietas, la cocina recibe todo en tiempo real y el administrador ve métricas, inventario que se merma solo y su lista de mandado en PDF.

Proyecto de **Hackathon de Inteligencia Artificial**. La app corre 100% en la terminal con datos simulados (modo mock), sin necesidad de claves ni backend.

---

## 🚀 Cómo ejecutar (en la terminal)

```bash
cd SGP/SGP
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente `http://localhost:5173`).

| Vista | Ruta | Acceso |
|---|---|---|
| Cliente (escaneo QR) | `/` | Elige una mesa → PIN de mesa (Mesa 1 = **1001**, … Mesa 15 = **1015**) |
| Menú de compra | `/menu` | (tras escanear) |
| Resumen del pedido | `/resumen` | flecha "Resumen" arriba a la derecha |
| Seguimiento | `/status` | tras enviar a cocina |
| Personal (login) | `/login` | PIN único **2580** (mesero / cocina / admin) |
| Cocina | `/kitchen` | rol Cocina |
| Mesero | `/waiter` | rol Mesero |
| Administrador | `/admin` | rol Admin |

> 💡 Para ver el flujo completo en tiempo real, abre varias pestañas (cliente, cocina, mesero y admin) — se sincronizan al instante.

---

## 📦 Los 10 entregables

1. **Nombre de la solución:** Ventum — Mesero Digital con IA.
2. **Problema que resuelve:** la toma manual de pedidos en restaurantes genera demoras, errores, saturación del personal en horas pico y poca trazabilidad. Ventum digitaliza y automatiza el flujo salón→cocina→administración.
3. **Usuario / área beneficiaria:** dueños de restaurante (eficiencia, métricas, control de inventario), personal de salón y cocina (menos carga y errores) y comensales (atención rápida, autónoma y personalizada).
4. **Descripción corta:** plataforma web responsive donde el cliente escanea un QR, pide desde su mesa con ayuda de la IA **Sheila**, y el pedido fluye en tiempo real a cocina, mesero y administración, mermando la materia prima automáticamente.
5. **Prototipo funcional / demostración:** ✅ ejecutable con `npm run dev` (modo mock, sin secretos). Ver tabla de rutas arriba.
6. **Herramientas utilizadas:** React 19, Vite 8, TypeScript, Tailwind CSS v4, React Router 7, Supabase (opcional, Realtime/Auth), Claude (`claude-haiku-4-5`, opcional vía Edge Function), `qrcode`, `jsPDF`, `lucide-react`, `canvas-confetti`. Detalle en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
7. **Prompts, flujo o arquitectura básica:** ver [`docs/PROMPTS-IA.md`](docs/PROMPTS-IA.md) y [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
8. **Impacto esperado:** menos errores de pedido, ~20–30% menos tiempo de atención en horas pico, control de desperdicio/compras y data accionable para el dueño. Ver [`docs/MODELO-DE-NEGOCIO.md`](docs/MODELO-DE-NEGOCIO.md).
9. **Riesgos o consideraciones éticas:** privacidad de datos, riesgo de error de la IA en alergias (con disclaimer y validación humana), seguridad de accesos. Ver [`docs/ETICA-Y-PRIVACIDAD.md`](docs/ETICA-Y-PRIVACIDAD.md).
10. **Próximos pasos para implementación:** ver sección final de este README y [`docs/MODELO-DE-NEGOCIO.md`](docs/MODELO-DE-NEGOCIO.md).

---

## 🤖 ¿Qué hace la IA? (Criterio 4)

**Sheila**, la mesera digital (burbuja abajo a la derecha), funciona con un **motor híbrido**:

- **Motor local determinista** (siempre activo, sin claves): razona sobre los **ingredientes reales de cada plato** para:
  - Detectar **alérgenos** (gluten, lácteos, huevo, maní, mariscos…) y **dietas** (vegano, vegetariano, sin gluten/lactosa).
  - Recomendar platos **compatibles** y advertir los **incompatibles** ante restricciones del cliente.
  - Mostrar **ofertas del día** y **maridajes** (carrusel a la izquierda de la burbuja al agregar al carrito).
  - Estimar y comunicar **tiempos de espera** (pronóstico que **aprende** de las duraciones reales por franja horaria) y enviar mensajes cálidos si la comida tarda ≥15 min.
- **Claude (opcional)**: si configuras `VITE_AI_PROXY_URL`, Sheila usa `claude-haiku-4-5` vía una **Edge Function** (la API key vive sólo en el servidor). Si falla o no está, cae al motor local.

Otras piezas de inteligencia operativa:
- **Inventario que se merma solo:** cada pedido descuenta materia prima según la receta; barras de abastecimiento por color (verde >30%, amarillo 10–30%, rojo ≤10%, gris 0%) agrupadas por categoría, con **lista de mandado en PDF** (logo + casillas de check).
- **Métricas:** ventas, ticket promedio, **platos más vendidos** y **consumo por franja** (Almuerzo / Refacción / Cena).
- **Alergias en rojo** resaltadas en la pantalla de cocina para máximo cuidado.

---

## ✅ Cómo se corrigieron los criterios de la evaluación

- **02/08 (Pertinencia/Impacto):** QR reales descargables, pasarela de pago (simulada, integrable con Wompi/Mercado Pago), métricas y modelo de suscripción. Ver `docs/`.
- **04 (IA):** Sheila (híbrida) + pronóstico de espera + inventario inteligente.
- **06 (Viabilidad):** corregido el bug que rompía el panel del mesero en modo Supabase (ahora usa la API y funciona en ambos modos).
- **07 (Ética/Seguridad):** PIN centralizado en backend, **RLS** en el esquema SQL, disclaimer de alergias y [`docs/ETICA-Y-PRIVACIDAD.md`](docs/ETICA-Y-PRIVACIDAD.md).
- **09/10 (Pitch/Aprendizaje):** este README + [`docs/PITCH.md`](docs/PITCH.md) + [`docs/APRENDIZAJE.md`](docs/APRENDIZAJE.md).

---

## 🎨 Identidad de marca

Paleta burdeos fine-dining (`#6B0F1E` principal, `#A33A4A` acento, `#F3ECEC` crema, `#000`/`#3B0A12` oscuros) y tipografía display **Libre Baskerville**.

---

## 🧭 Próximos pasos para implementación

1. Conectar Supabase real (tablas y RLS ya están en `SGP/SGP/supabase_schema.sql`) y migrar el inventario/recetas a la base.
2. Migrar el acceso del personal de PIN a **Supabase Auth** con roles.
3. Desplegar la Edge Function de Sheila y activar Claude en producción.
4. Integrar pasarela de pago real (Wompi/Mercado Pago) y notificaciones push (FCM).
5. Fotografía profesional de platos y pruebas con un restaurante piloto.

---

## 📚 Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — arquitectura, flujo y stack.
- [`docs/PROMPTS-IA.md`](docs/PROMPTS-IA.md) — prompts y diseño de la IA.
- [`docs/ETICA-Y-PRIVACIDAD.md`](docs/ETICA-Y-PRIVACIDAD.md) — riesgos y ética.
- [`docs/PASARELA-DE-PAGO.md`](docs/PASARELA-DE-PAGO.md) — propuesta de integración de pagos.
- [`docs/MODELO-DE-NEGOCIO.md`](docs/MODELO-DE-NEGOCIO.md) — suscripción e impacto.
- [`docs/PITCH.md`](docs/PITCH.md) — guion del pitch.
- [`docs/APRENDIZAJE.md`](docs/APRENDIZAJE.md) — apropiación del aprendizaje.
- [`docs/ENTREGABLES.md`](docs/ENTREGABLES.md) — checklist de entregables.
- [`SGP/SGP/README.md`](SGP/SGP/README.md) — README técnico de la app.
