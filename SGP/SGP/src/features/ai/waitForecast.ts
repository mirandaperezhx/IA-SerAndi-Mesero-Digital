// ============================================================================
// Pronóstico de tiempos de espera (IA local que aprende del histórico)
// - Registra duraciones reales pending -> ready agrupadas por franja horaria.
// - Estima el ETA al momento de ordenar combinando histórico + carga de cocina.
// - Provee utilidades para los mensajes de Sheila a los 15 minutos.
// ============================================================================
import type { Order } from '../../types';

export type MealPeriod = 'almuerzo' | 'refaccion' | 'cena';

const SAMPLES_KEY = 'ventum_cook_samples';

// Duración base por franja (min) cuando aún no hay histórico suficiente.
const BASE_MINUTES: Record<MealPeriod, number> = {
  almuerzo: 16,
  refaccion: 11,
  cena: 18,
};

export function getMealPeriod(date: Date = new Date()): MealPeriod {
  const h = date.getHours();
  if (h >= 11 && h < 16) return 'almuerzo';
  if (h >= 19 && h <= 23) return 'cena';
  return 'refaccion'; // mañana / media tarde / madrugada
}

export function mealPeriodLabel(p: MealPeriod): string {
  return p === 'almuerzo' ? 'Almuerzo' : p === 'cena' ? 'Cena' : 'Refacción';
}

interface SampleStore {
  almuerzo: number[];
  refaccion: number[];
  cena: number[];
}

function readSamples(): SampleStore {
  try {
    const raw = localStorage.getItem(SAMPLES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return { almuerzo: [], refaccion: [], cena: [] };
}

function writeSamples(s: SampleStore) {
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(s));
}

// Registra una duración real (en minutos) para una franja.
export function recordCookDuration(minutes: number, when: Date = new Date()) {
  if (!isFinite(minutes) || minutes <= 0 || minutes > 180) return;
  const period = getMealPeriod(when);
  const store = readSamples();
  const arr = store[period];
  arr.push(Math.round(minutes));
  // Mantener ventana móvil de las últimas 20 muestras.
  if (arr.length > 20) arr.shift();
  store[period] = arr;
  writeSamples(store);
}

export function getAvgCookMinutes(period: MealPeriod = getMealPeriod()): number {
  const store = readSamples();
  const arr = store[period];
  if (!arr || arr.length === 0) return BASE_MINUTES[period];
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  // Mezcla suave con la base para estabilizar con pocas muestras.
  const weight = Math.min(arr.length, 8) / 8;
  return Math.round(avg * weight + BASE_MINUTES[period] * (1 - weight));
}

// Estima el ETA (min) al ordenar: base de la franja + carga de cocina + tamaño del pedido.
export function estimateWaitMinutes(
  itemCount: number,
  kitchenLoad: number,
  when: Date = new Date()
): number {
  const base = getAvgCookMinutes(getMealPeriod(when));
  const loadPenalty = Math.max(0, kitchenLoad) * 3; // 3 min por pedido en cola
  const sizePenalty = Math.max(0, itemCount - 1) * 1.5;
  return Math.max(5, Math.round(base + loadPenalty + sizePenalty));
}

export function getElapsedMinutes(order: Pick<Order, 'created_at'>): number {
  const start = new Date(order.created_at).getTime();
  return Math.max(0, (Date.now() - start) / 60000);
}

// Minutos restantes estimados (puede ser negativo si ya se pasó del ETA).
export function getRemainingMinutes(order: Order): number {
  const eta = order.eta_minutes ?? getAvgCookMinutes();
  return Math.round(eta - getElapsedMinutes(order));
}
