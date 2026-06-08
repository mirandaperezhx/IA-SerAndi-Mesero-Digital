// ============================================================================
// Sheila — capa híbrida de la mesera digital con IA
// - Si VITE_AI_PROXY_URL está configurado, delega a un proxy seguro
//   (Supabase Edge Function) que llama a Claude server-side.
// - Si no, usa el motor local determinista (dietEngine + waitForecast).
// La API key NUNCA vive en el navegador.
// ============================================================================
import type { Order, Product } from '../../types';
import {
  filterByRestrictions, getOffersOfDay, getPairings, routeIntent, getDietTags, getAllergens,
} from './dietEngine';
import { getRemainingMinutes, getElapsedMinutes } from './waitForecast';
import { mockProducts, productById } from '../../services/mockData';
import { formatCOP } from '../../utils/formatPrice';

export interface SheilaResponse {
  text: string;
  suggestions?: Product[];
}

export interface SheilaContext {
  sessionOrders?: Order[];
}

// En producción (build desplegado) usamos el proxy del propio servidor en
// /api/sheila por defecto; se puede sobreescribir con VITE_AI_PROXY_URL.
// En desarrollo no hay servidor de IA, así que se usa el motor local.
const PROXY_URL =
  (import.meta.env.VITE_AI_PROXY_URL as string | undefined) ??
  (import.meta.env.PROD ? '/api/sheila' : undefined);

export const SHEILA_GREETING =
  '¡Hola! Soy Sheila, tu mesera digital de Ventum 🍷 ¿En qué puedo ayudarte hoy? Cuéntame qué se te antoja o si tienes alguna restricción alimenticia.';

export const ALLERGY_DISCLAIMER =
  '⚠️ Mis sugerencias se basan en los ingredientes registrados. Si tienes una alergia grave, confírmalo siempre con el personal antes de ordenar.';

// ---- Mensaje proactivo de espera (≥15 min sin estar listo) ----
export function waitMessageForOrders(orders: Order[]): string | null {
  const active = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  if (active.length === 0) return null;
  const longWait = active.find((o) => getElapsedMinutes(o) >= 15);
  if (longWait) {
    return 'Tu comida está quedando deliciosa 👩‍🍳 ¡Gracias por tu paciencia! Nuestro chef le está dando el toque final para que llegue perfecta a tu mesa.';
  }
  return null;
}

// ---- Respuesta de espera basada en los pedidos del cliente ----
function answerWait(ctx: SheilaContext): SheilaResponse {
  const orders = ctx.sessionOrders ?? [];
  const active = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  if (active.length === 0) {
    return {
      text: 'Aún no veo pedidos en curso en tu mesa. Cuando ordenes, te iré contando cuánto falta para que tu comida llegue 😊',
    };
  }

  const proactive = waitMessageForOrders(orders);
  const lines = active.map((o) => {
    if (o.status === 'ready') return '🛎️ ¡Uno de tus pedidos ya está listo! El mesero va en camino a tu mesa.';
    const remaining = getRemainingMinutes(o);
    if (remaining <= 1) return '⏳ Tu pedido está saliendo de la cocina en cualquier momento.';
    return `⏳ A tu pedido le faltan aproximadamente **${remaining} min**.`;
  });

  const text = [proactive, ...lines].filter(Boolean).join('\n\n');
  return { text };
}

// ---- Ofertas ----
function answerOffers(): SheilaResponse {
  const offers = getOffersOfDay();
  if (offers.length === 0) return { text: 'Hoy no tenemos promociones activas, ¡pero todo nuestro menú está delicioso!' };
  const list = offers.map((p) => `• **${p.name}** (${formatCOP(p.price)})${p.offerLabel ? ` — ${p.offerLabel}` : ''}`).join('\n');
  return {
    text: `🔥 Estas son las ofertas del día en Ventum:\n\n${list}\n\n¿Te animo con alguna?`,
    suggestions: offers,
  };
}

// ---- Restricciones / dietas / alergias ----
function answerRestrictions(text: string): SheilaResponse {
  const { parsed, compatibles, incompatibles } = filterByRestrictions(text);

  if (parsed.diets.size === 0 && parsed.allergens.size === 0) {
    return {
      text: 'Cuéntame qué necesitas evitar y te armo opciones. Por ejemplo: *"soy vegano"*, *"soy alérgico al gluten"* o *"no consumo lácteos"*.',
    };
  }

  const top = compatibles.slice(0, 4);
  const compatText = top.length
    ? top.map((p) => `• **${p.name}** (${formatCOP(p.price)}) — ${getDietTags(p).join(', ') || 'apto'}`).join('\n')
    : 'Mmm, con esas restricciones no encuentro un plato 100% seguro. Déjame avisar al personal para ayudarte personalmente.';

  const warn = incompatibles.length
    ? `\n\nMejor evita ${incompatibles.length} plato(s) que no encajan (ej: ${incompatibles[0].product.name} ${incompatibles[0].reasons.join(' y ')}).`
    : '';

  return {
    text: `🥗 Según lo que me cuentas, te recomiendo:\n\n${compatText}${warn}\n\n${ALLERGY_DISCLAIMER}`,
    suggestions: top,
  };
}

// ---- Recomendación general ----
function answerRecommendation(ctx: SheilaContext): SheilaResponse {
  const offers = getOffersOfDay();
  const star = productById.get('p-bandeja');
  const picks = [star, ...offers].filter(Boolean) as Product[];
  const unique = Array.from(new Map(picks.map((p) => [p.id, p])).values()).slice(0, 4);

  // Si ya tiene algo pedido, sugiere maridaje
  const lastOrder = ctx.sessionOrders?.[ctx.sessionOrders.length - 1];
  const lastItem = lastOrder?.items?.[0];
  if (lastItem) {
    const pair = getPairings(lastItem.product_id);
    if (pair.length) {
      return {
        text: `Con tu **${lastItem.product_name}** combina muy bien:`,
        suggestions: pair,
      };
    }
  }

  return {
    text: 'Te recomiendo nuestros imperdibles de la casa 😋',
    suggestions: unique,
  };
}

function answerGreeting(): SheilaResponse {
  return { text: SHEILA_GREETING };
}

// ---- Motor local ----
function localAnswer(userText: string, ctx: SheilaContext): SheilaResponse {
  const intent = routeIntent(userText);
  switch (intent) {
    case 'ofertas': return answerOffers();
    case 'restricciones': return answerRestrictions(userText);
    case 'espera': return answerWait(ctx);
    case 'recomendacion': return answerRecommendation(ctx);
    case 'saludo': return answerGreeting();
    default:
      // Intento de detectar restricción aunque no haya disparado el intent
      // eslint-disable-next-line no-case-declarations
      const r = filterByRestrictions(userText);
      if (r.parsed.diets.size || r.parsed.allergens.size) return answerRestrictions(userText);
      return {
        text: 'Puedo ayudarte con las **ofertas del día**, con **restricciones alimenticias** (alergias o dietas) o contarte **cuánto falta** para tu pedido. ¿Qué prefieres?',
      };
  }
}

// ---- Punto de entrada híbrido ----
export async function askSheila(userText: string, ctx: SheilaContext = {}): Promise<SheilaResponse> {
  if (PROXY_URL) {
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          menu: mockProducts.map((p) => ({
            id: p.id, name: p.name, price: p.price,
            allergens: getAllergens(p), diet: getDietTags(p),
          })),
          orders: (ctx.sessionOrders ?? []).map((o) => ({
            status: o.status, eta: o.eta_minutes, created_at: o.created_at,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const suggestions = (data.suggestionIds as string[] | undefined)
          ?.map((id) => productById.get(id))
          .filter(Boolean) as Product[] | undefined;
        return { text: data.text ?? localAnswer(userText, ctx).text, suggestions };
      }
    } catch {
      /* cae al motor local */
    }
  }
  return localAnswer(userText, ctx);
}
