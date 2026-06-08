// ============================================================================
// Ventum — Servidor de producción (Railway)
// ----------------------------------------------------------------------------
// 1. Sirve el frontend compilado (carpeta dist/).
// 2. Expone POST /api/sheila como proxy SEGURO hacia Google Gemini.
//    La GEMINI_API_KEY vive SOLO aquí (variable de entorno del servidor),
//    nunca se expone al navegador. Cumple el criterio de ética/seguridad.
//
// El front envía: { message, menu, orders }
// Responde:       { text, suggestionIds? }
//
// Si no hay GEMINI_API_KEY, /api/sheila responde 503 y el front cae
// automáticamente a su motor local determinista (dietEngine).
// ============================================================================
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ---- Endpoint de IA (proxy a Gemini) --------------------------------------
app.post('/api/sheila', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY no configurada' });
  }

  try {
    const { message, menu, orders } = req.body ?? {};

    const system = [
      'Eres Sheila, la mesera digital del restaurante colombiano Ventum.',
      'Eres cálida, breve y servicial. Tuteas al cliente y usas emojis con mesura.',
      'Usa EXCLUSIVAMENTE el menú y los pedidos que te entregan como contexto.',
      'Si el cliente menciona alergias o dietas, filtra los platos por sus alérgenos/etiquetas',
      'y NUNCA recomiendes algo incompatible. Añade el aviso de confirmar alergias graves con el personal.',
      'Si pregunta por su comida, usa el ETA de sus pedidos para tranquilizarlo; si lleva 15+ min, dilo con cariño.',
      'Cuando sugieras platos, incluye al final una línea EXACTA: SUGERENCIAS: id1,id2 (ids del menú).',
      '',
      `MENÚ: ${JSON.stringify(menu ?? [])}`,
      `PEDIDOS DEL CLIENTE: ${JSON.stringify(orders ?? [])}`,
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const gemRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: String(message ?? '') }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
      }),
    });

    if (!gemRes.ok) {
      const detail = await gemRes.text();
      console.error('[Sheila] Gemini error:', gemRes.status, detail);
      return res.status(502).json({ error: 'Gemini no disponible' });
    }

    const data = await gemRes.json();
    const raw = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();

    let text = raw;
    let suggestionIds;
    const m = raw.match(/SUGERENCIAS:\s*([a-z0-9,\-\s]+)/i);
    if (m) {
      suggestionIds = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      text = raw.replace(m[0], '').trim();
    }

    return res.json({ text, suggestionIds });
  } catch (err) {
    console.error('[Sheila] error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// ---- Servir el frontend compilado -----------------------------------------
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// SPA fallback: cualquier ruta no-API devuelve index.html
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Ventum escuchando en puerto ${PORT}`);
  console.log(`Sheila IA (Gemini): ${GEMINI_API_KEY ? 'ACTIVA · ' + GEMINI_MODEL : 'inactiva (motor local)'}`);
});
