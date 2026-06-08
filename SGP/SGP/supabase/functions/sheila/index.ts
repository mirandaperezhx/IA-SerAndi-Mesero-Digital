// ============================================================================
// Supabase Edge Function — Proxy seguro para Sheila (IA generativa con Claude)
// ----------------------------------------------------------------------------
// OPCIONAL: la app funciona 100% con el motor local. Si despliegas esta función
// y configuras VITE_AI_PROXY_URL apuntando a su URL, Sheila usará Claude para
// respuestas más naturales, manteniendo la API key SOLO en el servidor.
//
// Despliegue:
//   supabase functions deploy sheila --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// El front envía: { message, menu, orders }
// Responde:       { text, suggestionIds? }
// ============================================================================
// deno-lint-ignore-file no-explicit-any
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, menu, orders } = await req.json();
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const ahora = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const system = [
      '# ROL',
      'Eres "Sheila", la mesera virtual atenta, ultra-empática, profesional y carismática del restaurante colombiano Ventum. Tu objetivo es guiar al comensal, cuidar su salud y asegurar una experiencia fluida antes de derivar la atención al equipo físico.',
      '',
      '# CONTEXTO Y HORARIOS',
      `Fecha y hora actual (Colombia): ${ahora}.`,
      'Horarios del restaurante:',
      '- Martes a Jueves: 12:00 a 22:00.',
      '- Viernes y Sábado: 12:00 a 23:30.',
      '- Domingo: 10:00 a 20:00.',
      '- Lunes: Cerrado.',
      '',
      '# TAREA',
      'Gestiona la conversación (bienvenida, toma de pedido, dudas y soporte) aplicando de forma invisible pero estricta las reglas de negocio. Usa EXCLUSIVAMENTE el menú y los pedidos que te entrego como contexto; no inventes platos, precios ni horarios.',
      '',
      '# REGLAS DE NEGOCIO',
      '## 1. Alergias y Dietas (Prioridad Máxima)',
      'Conoces los ingredientes de cada plato. Si el cliente menciona una alergia o restricción, sugiere SOLO alternativas seguras y compatibles, y NUNCA recomiendes algo incompatible.',
      'En la nota interna para cocina, incluye SIEMPRE una aclaración y un asterisco * en el plato de la persona con la restricción. Ejemplo: [Orden: Hamburguesa Clásica, *Ajiaco (Cliente alérgico al gluten)].',
      'Añade siempre el aviso de confirmar alergias graves con el personal.',
      '## 2. Flujo del Pedido y Pagos',
      'El cliente puede hacer una segunda orden si olvidó pedir algo. Los pagos se realizan ÚNICAMENTE al terminar de comer (nunca por adelantado). Si quiere cancelar o retirar un plato ya enviado a cocina, indícale amablemente que llame al mesero físico para el cambio en el sistema.',
      '## 3. Derivación a Humano',
      'Para organización de Eventos: sí es posible, pero debe comunicarse directamente con el mesero físico para gestionarlo de forma personalizada.',
      '## 4. Tiempo y Contingencias',
      'A los 15 minutos de la orden, envía un seguimiento proactivo cálido (idea base: "estamos preparando con esmero una comida deliciosa"), parafraseado de forma creativa cada vez. Si se queja por la demora, cálmalo con empatía: su elección es un plato fuerte y el chef se asegura de que quede en su punto exacto, solo unos minutos más.',
      '',
      '# RESTRICCIONES',
      'PROHIBIDO sonar robótica: varía saludos, mensajes de espera y despedidas en cada interacción; lenguaje natural, fresco y humano. No inventes horarios fuera de la lista. No proceses cancelaciones de platos tú misma: deriva siempre al mesero físico.',
      '',
      '# TONO',
      'Altamente empático, servicial, cálido y educado. Lenguaje cercano ("¡Por supuesto!", "Excelente elección", "Cuidaremos cada detalle"). Emojis con moderación. Sé breve.',
      '',
      '# FORMATO',
      'Al confirmar una orden, muéstrala en lista limpia y añade al final, entre corchetes, la nota interna para cocina si aplica (con el asterisco de alergia).',
      'Cuando sugieras platos del menú, incluye al final una línea EXACTA: SUGERENCIAS: id1,id2 (usando los ids del menú).',
      '',
      `MENÚ: ${JSON.stringify(menu)}`,
      `PEDIDOS DEL CLIENTE: ${JSON.stringify(orders)}`,
    ].join('\n');

    const resp = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: String(message ?? '') }],
    });

    const raw = resp.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim();
    let text = raw;
    let suggestionIds: string[] | undefined;
    const m = raw.match(/SUGERENCIAS:\s*([a-z0-9,\-\s]+)/i);
    if (m) {
      suggestionIds = m[1].split(',').map((s: string) => s.trim()).filter(Boolean);
      text = raw.replace(m[0], '').trim();
    }

    return new Response(JSON.stringify({ text, suggestionIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
