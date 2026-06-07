# Prompts y diseño de la IA · Sheila

Sheila usa un **enfoque híbrido**: un motor local determinista (siempre activo) y, opcionalmente, Claude (`claude-haiku-4-5`) para lenguaje más natural. Así garantizamos que la IA **nunca se equivoque en alergias** (la decisión la toma código verificable) y a la vez ofrezca una conversación cálida.

## 1. Motor local (fuente de verdad)
No usa LLM: razona sobre los ingredientes reales de cada plato.
- `getAllergens(plato)` = unión de alérgenos de sus ingredientes.
- `getDietTags(plato)` = deriva *Vegano / Vegetariano / Sin gluten / Sin lactosa*.
- `parseRestrictions(texto)` = extrae dietas y alérgenos de lo que escribe el cliente.
- `filterByRestrictions(texto)` = separa platos **compatibles** e **incompatibles** con su motivo.
- `getPairings(idPlato)` = maridajes curados.
- `estimateWaitMinutes(...)` = ETA aprendido por franja horaria.

## 2. Prompt de sistema para Claude (Edge Function `supabase/functions/sheila`)
Resumen del system prompt (texto real en el archivo):

> Eres Sheila, la mesera digital del restaurante colombiano Ventum. Eres cálida, breve y servicial; tuteas al cliente y usas emojis con mesura. Usa **exclusivamente** el menú y los pedidos que te entregan como contexto. Si el cliente menciona alergias o dietas, **filtra** los platos por sus alérgenos/etiquetas y **nunca** recomiendes algo incompatible; añade el aviso de confirmar alergias graves con el personal. Si pregunta por su comida, usa el ETA de sus pedidos para tranquilizarlo; si lleva 15+ min, dilo con cariño. Cuando sugieras platos, termina con una línea `SUGERENCIAS: id1,id2`.

El contexto que se inyecta en cada llamada:
```json
{
  "message": "soy alérgica al gluten, ¿qué me recomiendas?",
  "menu":   [{ "id": "...", "name": "...", "price": 0, "allergens": ["gluten"], "diet": ["Vegano"] }],
  "orders": [{ "status": "preparing", "eta": 16, "created_at": "..." }]
}
```
Respuesta esperada: `{ "text": "...", "suggestionIds": ["p-pat","p-lulo"] }`.

> Para mitigar errores del LLM, el front puede revalidar las sugerencias contra el motor local antes de mostrarlas.

## 3. Prompts usados durante el desarrollo (asistido por IA)
Ejemplos representativos de cómo se construyó el proyecto con un asistente de código:
- "Diseña un modelo de datos donde alérgenos y dietas se deriven de las recetas de cada plato."
- "Crea un pronóstico de tiempo de espera que aprenda de las duraciones reales por franja (almuerzo/refacción/cena)."
- "Resalta en rojo en la pantalla de cocina cualquier nota que indique una alergia."
- "Genera un PDF de lista de mandado con logo y casillas de check para ingredientes bajo el 30%."
