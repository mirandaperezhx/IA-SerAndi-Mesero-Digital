# Apropiación del aprendizaje · Ventum (Criterio 10)

## Qué construimos y por qué
Partimos de un MVP funcional de pedidos por QR y lo elevamos a una solución con **IA aplicada de verdad**, no decorativa: la inteligencia resuelve problemas concretos (alergias, espera, inventario, decisiones del dueño).

## Decisiones de diseño y aprendizajes

1. **IA híbrida en vez de "todo al LLM".**
   Aprendimos que para temas críticos (alergias) un **motor determinista** es más seguro y barato que un LLM, y que el LLM aporta donde brilla: lenguaje natural. El patrón "código decide, LLM conversa" resultó robusto y demostrable sin claves.

2. **Seguridad de claves.**
   Nunca exponer la API key en el navegador → la integración con Claude se hace vía **Edge Function** (proxy). Esto nos obligó a entender el límite cliente/servidor.

3. **Una sola fuente de verdad.**
   Alérgenos y dietas se **derivan** de las recetas; así el menú y la IA nunca se contradicen. Modelar bien los datos simplificó toda la lógica.

4. **Tiempo real sin backend.**
   Usar `BroadcastChannel` para simular Supabase Realtime nos permitió demostrar el flujo completo en la terminal, con el mismo contrato de eventos que la versión real.

5. **IA que aprende.**
   El pronóstico de espera mejora con cada pedido (promedio móvil por franja). Entendimos cómo un sistema simple puede "aprender" sin entrenar modelos.

6. **Detalle que importa.**
   Resaltar alergias en rojo en cocina nació de pensar en el usuario real (el cocinero) y el riesgo de salud. La IA y la UX deben servir a las personas.

## Si tuviéramos más tiempo
- Revalidar sugerencias del LLM contra el motor local automáticamente.
- Pronóstico de demanda por día/hora para compras.
- Pruebas automatizadas y A/B testing de upselling de Sheila.

## Herramientas y conceptos apropiados
React/TypeScript, Tailwind v4 tokens, Context API, eventos en tiempo real, RLS de Postgres, prompting de sistema, integración segura de LLM, generación de PDF/QR en cliente.
