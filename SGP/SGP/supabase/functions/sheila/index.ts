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

    const system = [
      'Eres Sheila, la mesera digital del restaurante colombiano Ventum.',
      'Eres cálida, breve y servicial. Tuteas al cliente y usas emojis con mesura.',
      'Usa EXCLUSIVAMENTE el menú y los pedidos que te entregan como contexto.',
      'Si el cliente menciona alergias o dietas, filtra los platos por sus alérgenos/etiquetas',
      'y NUNCA recomiendes algo incompatible. Añade el aviso de confirmar alergias graves con el personal.',
      'Si pregunta por su comida, usa el ETA de sus pedidos para tranquilizarlo; si lleva 15+ min, dilo con cariño.',
      'Cuando sugieras platos, incluye al final una línea EXACTA: SUGERENCIAS: id1,id2 (ids del menú).',
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
