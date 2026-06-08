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
