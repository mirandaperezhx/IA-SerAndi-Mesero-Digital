# Pasarela de pago · Propuesta de integración (Criterio 2/8)

## Estado actual (MVP)
El cobro está implementado en el panel del mesero con un **modal de pasarela simulada** que ofrece **Nequi, Wompi, Tarjeta y Efectivo**. Al confirmar, se cierra la cuenta y se inicia el temporizador de 15 minutos. Esto valida el flujo de UX end-to-end sin procesar dinero real.

## Propuesta de integración real

### Opción recomendada para Colombia: **Wompi** (Bancolombia)
- Soporta **Nequi, PSE, tarjetas y Bancolombia** — cobertura ideal para el mercado objetivo.
- Flujo sugerido (Checkout/Widget):
  1. El backend crea una transacción con el `amount_in_cents` calculado **server-side** (nunca desde el cliente).
  2. Se abre el Widget de Wompi con el `public_key` y la referencia de la cuenta/mesa.
  3. Wompi notifica el resultado vía **webhook** firmado → el backend marca la sesión como `paid`.
  4. La app cierra la mesa y emite el evento `session_closed` (mismo flujo que hoy).

### Alternativa regional: **Mercado Pago**
- `Checkout Pro` o `Bricks`; útil si se busca expansión a otros países de LATAM.

### Consideraciones técnicas
- Cálculo de montos y verificación de webhooks **siempre en el backend** (Supabase Edge Function), con las llaves secretas fuera del navegador.
- Idempotencia por `referencia = sessionId` para evitar cobros duplicados.
- Conciliación: guardar `transaction_id`, método y estado en la tabla `table_sessions`.
- Soporte de **propina** y **división de cuenta** como mejoras posteriores.

### Dónde se conecta en el código
- `WaiterDashboard.confirmPayment()` reemplazaría la simulación por la creación de la transacción.
- `sgpApi.payAndCloseSession()` se llamaría tras la confirmación del webhook.
