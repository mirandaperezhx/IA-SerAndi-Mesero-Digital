// ============================================================================
// Motor local de dieta y alérgenos (fuente de verdad de Sheila)
// Razona sobre los ingredientes (recetas) de cada plato para detectar
// alérgenos, compatibilidad con dietas y maridajes. 100% offline.
// ============================================================================
import type { Allergen, Product } from '../../types';
import { mockIngredients, mockProducts, productById } from '../../services/mockData';

const ingredientById = new Map(mockIngredients.map((i) => [i.id, i]));

// ---- Alérgenos del producto (unión de los de su receta) ----
export function getAllergens(product: Product): Allergen[] {
  const set = new Set<Allergen>();
  product.recipe?.forEach(({ ingredientId }) => {
    ingredientById.get(ingredientId)?.allergens.forEach((a) => set.add(a));
  });
  return Array.from(set);
}

function recipeIngredients(product: Product) {
  return (product.recipe ?? [])
    .map((r) => ingredientById.get(r.ingredientId))
    .filter(Boolean) as typeof mockIngredients;
}

export function hasAnimal(product: Product): boolean {
  return recipeIngredients(product).some((i) => i.animal);
}

export function hasMeat(product: Product): boolean {
  // Carne/pescado: grupo 'carnes' excepto el huevo (apto vegetariano)
  return recipeIngredients(product).some((i) => i.group === 'carnes' && i.id !== 'huevo');
}

// ---- Etiquetas de dieta derivadas ----
export function getDietTags(product: Product): string[] {
  const tags: string[] = [];
  const allergens = getAllergens(product);
  if (!hasAnimal(product)) tags.push('Vegano');
  if (!hasMeat(product)) tags.push('Vegetariano');
  if (!allergens.includes('gluten')) tags.push('Sin gluten');
  if (!allergens.includes('lacteos')) tags.push('Sin lactosa');
  return tags;
}

// ---- Parseo de restricciones desde texto libre ----
export interface ParsedRestrictions {
  diets: Set<'vegano' | 'vegetariano'>;
  allergens: Set<Allergen>;
  raw: string;
}

const ALLERGEN_KEYWORDS: Record<string, Allergen> = {
  gluten: 'gluten', celiac: 'gluten', 'celíac': 'gluten', celiaco: 'gluten', 'celíaco': 'gluten', trigo: 'gluten', harina: 'gluten',
  lactosa: 'lacteos', 'lácteo': 'lacteos', lacteo: 'lacteos', leche: 'lacteos', dairy: 'lacteos', queso: 'lacteos',
  huevo: 'huevo', egg: 'huevo',
  'maní': 'mani', mani: 'mani', peanut: 'mani', cacahuate: 'mani',
  'fruto seco': 'frutos_secos', 'frutos secos': 'frutos_secos', nuez: 'frutos_secos', nueces: 'frutos_secos', nut: 'frutos_secos',
  marisco: 'mariscos', mariscos: 'mariscos', 'camarón': 'mariscos', camaron: 'mariscos', shellfish: 'mariscos',
  pescado: 'pescado', fish: 'pescado',
  soya: 'soya', soja: 'soya',
  alcohol: 'alcohol', licor: 'alcohol',
};

export function parseRestrictions(text: string): ParsedRestrictions {
  const t = text.toLowerCase();
  const diets = new Set<'vegano' | 'vegetariano'>();
  const allergens = new Set<Allergen>();

  if (/\bvegano|vegana|vegan\b/.test(t)) diets.add('vegano');
  if (/\bvegetarian/.test(t)) diets.add('vegetariano');

  for (const [kw, allergen] of Object.entries(ALLERGEN_KEYWORDS)) {
    if (t.includes(kw)) allergens.add(allergen);
  }
  return { diets, allergens, raw: text };
}

// ---- Evaluación de un plato frente a restricciones ----
export interface ProductEval {
  product: Product;
  ok: boolean;
  reasons: string[]; // motivos de incompatibilidad
}

const allergenLabel: Record<Allergen, string> = {
  gluten: 'contiene gluten', lacteos: 'contiene lácteos', huevo: 'contiene huevo',
  frutos_secos: 'contiene frutos secos', mani: 'contiene maní', mariscos: 'contiene mariscos',
  pescado: 'contiene pescado', soya: 'contiene soya', alcohol: 'contiene alcohol',
};

export function evaluateProduct(product: Product, r: ParsedRestrictions): ProductEval {
  const reasons: string[] = [];
  const productAllergens = getAllergens(product);

  if (r.diets.has('vegano') && hasAnimal(product)) reasons.push('no es vegano');
  if (r.diets.has('vegetariano') && hasMeat(product)) reasons.push('no es vegetariano');

  r.allergens.forEach((a) => {
    if (productAllergens.includes(a)) reasons.push(allergenLabel[a]);
  });

  return { product, ok: reasons.length === 0, reasons };
}

export function filterByRestrictions(text: string): {
  parsed: ParsedRestrictions;
  compatibles: Product[];
  incompatibles: ProductEval[];
} {
  const parsed = parseRestrictions(text);
  const compatibles: Product[] = [];
  const incompatibles: ProductEval[] = [];

  mockProducts.forEach((p) => {
    const ev = evaluateProduct(p, parsed);
    if (ev.ok) compatibles.push(p);
    else incompatibles.push(ev);
  });

  return { parsed, compatibles, incompatibles };
}

// ---- Ofertas del día ----
export function getOffersOfDay(): Product[] {
  return mockProducts.filter((p) => p.isOffer);
}

// ---- Maridajes ----
export function getPairings(productId: string): Product[] {
  const product = productById.get(productId);
  if (!product?.pairings) return [];
  return product.pairings
    .map((id) => productById.get(id))
    .filter(Boolean) as Product[];
}

// ---- Detección de notas con alergias (para resaltar en cocina) ----
export function noteHasAllergyWarning(note?: string | null): boolean {
  if (!note) return false;
  const t = note.toLowerCase();
  return /alerg|alérg|celiac|celíac|intoleran|sin gluten|sin lactosa|vegano|vegetarian|no puede comer|no como/.test(t);
}

// ---- Enrutado de intención para el fallback local ----
export type Intent = 'ofertas' | 'restricciones' | 'espera' | 'recomendacion' | 'saludo' | 'desconocido';

export function routeIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/oferta|promo|descuento|barato|económic/.test(t)) return 'ofertas';
  if (/alerg|alérg|vegan|vegetarian|gluten|lactosa|celiac|celíac|dieta|sin (gluten|lactosa|huevo)|no puedo comer/.test(t)) return 'restricciones';
  if (/(dónde|donde|cuánto|cuanto|cuándo|cuando|demora|tarda|espera|listo|mi (comida|pedido|plato))/.test(t)) return 'espera';
  if (/recomien|suger|qué pido|que pido|rico|mejor plato|antoj/.test(t)) return 'recomendacion';
  if (/hola|buenas|buenos días|buenas tardes|buenas noches|hey|saludos/.test(t)) return 'saludo';
  return 'desconocido';
}
