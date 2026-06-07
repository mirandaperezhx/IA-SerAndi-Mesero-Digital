import type {
  Store, Table, Category, Product, Order, TableSession, OrderStatus, Ingredient,
} from '../types';
import { estimateWaitMinutes, recordCookDuration } from '../features/ai/waitForecast';

// ============================================================================
// 1. STORE — Ventum
// ============================================================================
export const mockStore: Store = {
  id: 'store-ventum',
  name: 'Ventum',
  slug: 'ventum',
  logo_url: '/logo.svg',
  pin_code: '2580', // PIN único de personal (admin, mesero, cocina)
  created_at: new Date().toISOString(),
};

// ============================================================================
// 2. MESAS (15 mesas, passcodes 1001..1015)
// ============================================================================
export const mockTables: Table[] = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1;
  return {
    id: `table-${index}`,
    store_id: mockStore.id,
    name: `Mesa ${index}`,
    passcode: (1000 + index).toString(),
    active: true,
    created_at: new Date().toISOString(),
  };
});

// ============================================================================
// 3. CATEGORÍAS (5)
// ============================================================================
export const mockCategories: Category[] = [
  { id: 'cat-entradas', store_id: mockStore.id, name: 'Entradas', order_index: 1, created_at: new Date().toISOString() },
  { id: 'cat-rapida', store_id: mockStore.id, name: 'Comida Rápida', order_index: 2, created_at: new Date().toISOString() },
  { id: 'cat-trad', store_id: mockStore.id, name: 'Tradicionales', order_index: 3, created_at: new Date().toISOString() },
  { id: 'cat-postres', store_id: mockStore.id, name: 'Postres', order_index: 4, created_at: new Date().toISOString() },
  { id: 'cat-bebidas', store_id: mockStore.id, name: 'Bebidas', order_index: 5, created_at: new Date().toISOString() },
];

// ============================================================================
// 4. MATERIA PRIMA (catálogo maestro de inventario)
//    fillPct = nivel inicial; stock = round(capacity * fillPct)
// ============================================================================
type Seed = {
  id: string; name: string; group: Ingredient['group']; capacity: number;
  fillPct: number; unit: string; allergens?: Ingredient['allergens']; animal?: boolean;
};

const ingredientSeeds: Seed[] = [
  // FRUTAS
  { id: 'fresa', name: 'Fresa', group: 'frutas', capacity: 3000, fillPct: 0.70, unit: 'g' },
  { id: 'mora', name: 'Mora', group: 'frutas', capacity: 2000, fillPct: 0.25, unit: 'g' },
  { id: 'arandano', name: 'Arándano', group: 'frutas', capacity: 1500, fillPct: 0.40, unit: 'g' },
  { id: 'maracuya', name: 'Maracuyá', group: 'frutas', capacity: 2500, fillPct: 0.80, unit: 'g' },
  { id: 'lulo', name: 'Lulo', group: 'frutas', capacity: 2500, fillPct: 0.60, unit: 'g' },
  { id: 'limon', name: 'Limón', group: 'frutas', capacity: 4000, fillPct: 0.85, unit: 'g' },
  { id: 'coco', name: 'Coco', group: 'frutas', capacity: 1500, fillPct: 0.55, unit: 'g' },
  // VERDURAS
  { id: 'platano_verde', name: 'Plátano verde', group: 'verduras', capacity: 6000, fillPct: 0.75, unit: 'g' },
  { id: 'papa', name: 'Papa', group: 'verduras', capacity: 12000, fillPct: 0.90, unit: 'g' },
  { id: 'yuca', name: 'Yuca', group: 'verduras', capacity: 5000, fillPct: 0.65, unit: 'g' },
  { id: 'tomate', name: 'Tomate', group: 'verduras', capacity: 6000, fillPct: 0.70, unit: 'g' },
  { id: 'cebolla', name: 'Cebolla', group: 'verduras', capacity: 5000, fillPct: 0.80, unit: 'g' },
  { id: 'lechuga', name: 'Lechuga', group: 'verduras', capacity: 2000, fillPct: 0.50, unit: 'g' },
  { id: 'aguacate', name: 'Aguacate', group: 'verduras', capacity: 3000, fillPct: 0.45, unit: 'g' },
  { id: 'mazorca', name: 'Mazorca', group: 'verduras', capacity: 3000, fillPct: 0.60, unit: 'g' },
  { id: 'hierbabuena', name: 'Hierbabuena', group: 'verduras', capacity: 800, fillPct: 0.35, unit: 'g' },
  { id: 'cilantro', name: 'Cilantro', group: 'verduras', capacity: 1000, fillPct: 0.55, unit: 'g' },
  { id: 'guascas', name: 'Guascas', group: 'verduras', capacity: 600, fillPct: 0.08, unit: 'g' },
  { id: 'zanahoria', name: 'Zanahoria', group: 'verduras', capacity: 4000, fillPct: 0.75, unit: 'g' },
  // LEGUMBRES
  { id: 'frijol', name: 'Fríjol', group: 'legumbres', capacity: 8000, fillPct: 0.85, unit: 'g' },
  { id: 'arveja', name: 'Arveja', group: 'legumbres', capacity: 3000, fillPct: 0.60, unit: 'g' },
  // CARNES
  { id: 'carne_res', name: 'Carne de res', group: 'carnes', capacity: 10000, fillPct: 0.70, unit: 'g', animal: true },
  { id: 'pollo', name: 'Pollo', group: 'carnes', capacity: 10000, fillPct: 0.65, unit: 'g', animal: true },
  { id: 'cerdo', name: 'Cerdo / Chicharrón', group: 'carnes', capacity: 6000, fillPct: 0.50, unit: 'g', animal: true },
  { id: 'chorizo', name: 'Chorizo', group: 'carnes', capacity: 3000, fillPct: 0.40, unit: 'g', animal: true },
  { id: 'morcilla', name: 'Morcilla', group: 'carnes', capacity: 2000, fillPct: 0.30, unit: 'g', animal: true },
  { id: 'huevo', name: 'Huevo', group: 'carnes', capacity: 3000, fillPct: 0.80, unit: 'g', allergens: ['huevo'], animal: true },
  { id: 'tocino', name: 'Tocino', group: 'carnes', capacity: 2000, fillPct: 0.45, unit: 'g', animal: true },
  // LÁCTEOS
  { id: 'queso', name: 'Queso', group: 'lacteos', capacity: 4000, fillPct: 0.60, unit: 'g', allergens: ['lacteos'], animal: true },
  { id: 'leche', name: 'Leche', group: 'lacteos', capacity: 8000, fillPct: 0.70, unit: 'ml', allergens: ['lacteos'], animal: true },
  { id: 'crema_leche', name: 'Crema de leche', group: 'lacteos', capacity: 3000, fillPct: 0.50, unit: 'ml', allergens: ['lacteos'], animal: true },
  { id: 'mantequilla', name: 'Mantequilla', group: 'lacteos', capacity: 2000, fillPct: 0.65, unit: 'g', allergens: ['lacteos'], animal: true },
  { id: 'queso_crema', name: 'Queso crema', group: 'lacteos', capacity: 2000, fillPct: 0.40, unit: 'g', allergens: ['lacteos'], animal: true },
  { id: 'helado', name: 'Helado de vainilla', group: 'lacteos', capacity: 3000, fillPct: 0.55, unit: 'g', allergens: ['lacteos'], animal: true },
  { id: 'mozzarella', name: 'Mozzarella', group: 'lacteos', capacity: 3000, fillPct: 0.50, unit: 'g', allergens: ['lacteos'], animal: true },
  // BEBIDAS (base)
  { id: 'agua', name: 'Agua', group: 'bebidas', capacity: 20000, fillPct: 0.90, unit: 'ml' },
  { id: 'soda', name: 'Soda', group: 'bebidas', capacity: 8000, fillPct: 0.70, unit: 'ml' },
  { id: 'hielo', name: 'Hielo', group: 'bebidas', capacity: 10000, fillPct: 0.80, unit: 'g' },
  // ABARROTES
  { id: 'harina', name: 'Harina de trigo', group: 'abarrotes', capacity: 8000, fillPct: 0.75, unit: 'g', allergens: ['gluten'] },
  { id: 'pan_burger', name: 'Pan de hamburguesa', group: 'abarrotes', capacity: 200, fillPct: 0.60, unit: 'und', allergens: ['gluten'] },
  { id: 'masa_maiz', name: 'Masa de maíz', group: 'abarrotes', capacity: 6000, fillPct: 0.70, unit: 'g' },
  { id: 'arroz', name: 'Arroz', group: 'abarrotes', capacity: 10000, fillPct: 0.85, unit: 'g' },
  { id: 'aceite', name: 'Aceite', group: 'abarrotes', capacity: 6000, fillPct: 0.60, unit: 'ml' },
  { id: 'chocolate', name: 'Chocolate', group: 'abarrotes', capacity: 2000, fillPct: 0.50, unit: 'g' },
  { id: 'galleta', name: 'Galleta', group: 'abarrotes', capacity: 2000, fillPct: 0.45, unit: 'g', allergens: ['gluten'] },
  { id: 'azucar', name: 'Azúcar', group: 'abarrotes', capacity: 8000, fillPct: 0.80, unit: 'g' },
  { id: 'masa_pizza', name: 'Masa de pizza', group: 'abarrotes', capacity: 150, fillPct: 0.55, unit: 'und', allergens: ['gluten'] },
  { id: 'salsa_tomate', name: 'Salsa de tomate', group: 'abarrotes', capacity: 4000, fillPct: 0.65, unit: 'g' },
  { id: 'apanado', name: 'Apanado / Empanizado', group: 'abarrotes', capacity: 3000, fillPct: 0.50, unit: 'g', allergens: ['gluten'] },
  { id: 'bizcocho', name: 'Bizcocho', group: 'abarrotes', capacity: 2000, fillPct: 0.40, unit: 'g', allergens: ['gluten'] },
];

export const mockIngredients: Ingredient[] = ingredientSeeds.map((s) => ({
  id: s.id,
  name: s.name,
  group: s.group,
  capacity: s.capacity,
  stock: Math.round(s.capacity * s.fillPct),
  unit: s.unit,
  allergens: s.allergens ?? [],
  animal: s.animal ?? false,
}));

// ============================================================================
// 5. PRODUCTOS (15) con recetas (consumo de materia prima por unidad)
// ============================================================================
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

export const mockProducts: Product[] = [
  // ----------------- ENTRADAS -----------------
  {
    id: 'p-emp', category_id: 'cat-entradas', name: 'Empanadas con Ají',
    description: 'Crujientes empanadas de maíz rellenas de carne y papa, acompañadas del ají picado de la casa.',
    price: 9000, image_url: img('1541532713592-79a0317b6b77'),
    ingredients: ['Masa de maíz', 'Carne de res', 'Papa', 'Cebolla', 'Ají de la casa'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'masa_maiz', qty: 150 }, { ingredientId: 'carne_res', qty: 80 },
      { ingredientId: 'papa', qty: 60 }, { ingredientId: 'cebolla', qty: 20 },
      { ingredientId: 'aceite', qty: 40 }, { ingredientId: 'tomate', qty: 20 },
    ],
    pairings: ['p-lulo', 'p-limhier'],
  },
  {
    id: 'p-pat', category_id: 'cat-entradas', name: 'Patacones con Hogao',
    description: 'Plátano verde frito y aplastado, cubierto con nuestro hogao tradicional de tomate y cebolla.',
    price: 8500, image_url: img('1572656631137-7935297eff55'),
    ingredients: ['Plátano verde', 'Tomate', 'Cebolla', 'Cilantro', 'Aceite'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'platano_verde', qty: 250 }, { ingredientId: 'aceite', qty: 50 },
      { ingredientId: 'tomate', qty: 40 }, { ingredientId: 'cebolla', qty: 30 },
      { ingredientId: 'cilantro', qty: 5 },
    ],
    isOffer: true, offerLabel: '2x1 hoy',
    pairings: ['p-pollo', 'p-limcoco'],
  },
  {
    id: 'p-are', category_id: 'cat-entradas', name: 'Arepas Rellenas',
    description: 'Arepas asadas de maíz rellenas de queso fundido y un toque de mantequilla.',
    price: 9500, image_url: img('1550304943-4f24f54ddde9'),
    ingredients: ['Masa de maíz', 'Queso', 'Mantequilla'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'masa_maiz', qty: 180 }, { ingredientId: 'queso', qty: 60 },
      { ingredientId: 'mantequilla', qty: 15 },
    ],
    pairings: ['p-limhier', 'p-brownie'],
  },
  // ----------------- COMIDA RÁPIDA -----------------
  {
    id: 'p-pollo', category_id: 'cat-rapida', name: 'Pollo Broaster',
    description: 'Presas de pollo apanadas y fritas, súper jugosas por dentro y crocantes por fuera, con papas.',
    price: 23900, image_url: img('1568901346375-23c9450c58cd'),
    ingredients: ['Pollo', 'Apanado', 'Papa', 'Aceite'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'pollo', qty: 400 }, { ingredientId: 'apanado', qty: 80 },
      { ingredientId: 'aceite', qty: 60 }, { ingredientId: 'papa', qty: 200 },
    ],
    pairings: ['p-limcoco', 'p-brownie'],
  },
  {
    id: 'p-burger', category_id: 'cat-rapida', name: 'Hamburguesa Artesanal',
    description: 'Carne de res a la parrilla, queso, tocino crocante y vegetales frescos en pan artesanal, con papas.',
    price: 24900, image_url: img('1568901346375-23c9450c58cd'),
    ingredients: ['Pan artesanal', 'Carne de res', 'Queso', 'Tocino', 'Lechuga', 'Tomate'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'pan_burger', qty: 1 }, { ingredientId: 'carne_res', qty: 180 },
      { ingredientId: 'queso', qty: 30 }, { ingredientId: 'lechuga', qty: 15 },
      { ingredientId: 'tomate', qty: 25 }, { ingredientId: 'tocino', qty: 20 },
      { ingredientId: 'papa', qty: 150 }, { ingredientId: 'aceite', qty: 40 },
    ],
    pairings: ['p-lulo', 'p-brownie'],
  },
  {
    id: 'p-pizza', category_id: 'cat-rapida', name: 'Pizza Margarita',
    description: 'Masa horneada al estilo napolitano con salsa de tomate, mozzarella fundida y albahaca fresca.',
    price: 27900, image_url: img('1513104890138-7c749659a591'),
    ingredients: ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Tomate'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'masa_pizza', qty: 1 }, { ingredientId: 'salsa_tomate', qty: 80 },
      { ingredientId: 'mozzarella', qty: 120 }, { ingredientId: 'tomate', qty: 30 },
    ],
    pairings: ['p-limhier', 'p-cheese'],
  },
  // ----------------- TRADICIONALES -----------------
  {
    id: 'p-sudado', category_id: 'cat-trad', name: 'Sudado de Res',
    description: 'Tradicional sudado de res cocido a fuego lento con papa, yuca y verduras, servido con arroz.',
    price: 26900, image_url: img('1544025162-d76694265947'),
    ingredients: ['Carne de res', 'Papa', 'Yuca', 'Tomate', 'Cebolla', 'Arroz'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'carne_res', qty: 250 }, { ingredientId: 'papa', qty: 200 },
      { ingredientId: 'yuca', qty: 100 }, { ingredientId: 'tomate', qty: 50 },
      { ingredientId: 'cebolla', qty: 40 }, { ingredientId: 'cilantro', qty: 10 },
      { ingredientId: 'arroz', qty: 150 },
    ],
    pairings: ['p-lulo', 'p-trifle'],
  },
  {
    id: 'p-bandeja', category_id: 'cat-trad', name: 'Bandeja Paisa',
    description: 'La emblemática bandeja: fríjoles, arroz, carne, chorizo, morcilla, chicharrón, huevo, plátano y aguacate.',
    price: 32900, image_url: img('1544025162-d76694265947'),
    ingredients: ['Fríjol', 'Arroz', 'Carne de res', 'Chorizo', 'Morcilla', 'Chicharrón', 'Huevo', 'Plátano', 'Aguacate'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'frijol', qty: 250 }, { ingredientId: 'arroz', qty: 200 },
      { ingredientId: 'carne_res', qty: 120 }, { ingredientId: 'chorizo', qty: 80 },
      { ingredientId: 'morcilla', qty: 70 }, { ingredientId: 'cerdo', qty: 90 },
      { ingredientId: 'huevo', qty: 60 }, { ingredientId: 'platano_verde', qty: 80 },
      { ingredientId: 'aguacate', qty: 50 },
    ],
    isOffer: true, offerLabel: '-15% almuerzo',
    pairings: ['p-limcoco', 'p-trifle'],
  },
  {
    id: 'p-ajiaco', category_id: 'cat-trad', name: 'Ajiaco Santafereño',
    description: 'Sopa bogotana de tres papas, pollo desmechado, mazorca y guascas, con crema y aguacate aparte.',
    price: 25900, image_url: img('1607532941433-304659e8198a'),
    ingredients: ['Pollo', 'Papa', 'Mazorca', 'Guascas', 'Crema de leche', 'Aguacate', 'Arroz'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'pollo', qty: 200 }, { ingredientId: 'papa', qty: 300 },
      { ingredientId: 'mazorca', qty: 120 }, { ingredientId: 'guascas', qty: 15 },
      { ingredientId: 'crema_leche', qty: 40 }, { ingredientId: 'arroz', qty: 150 },
      { ingredientId: 'aguacate', qty: 40 },
    ],
    pairings: ['p-pat', 'p-lulo'],
  },
  // ----------------- POSTRES -----------------
  {
    id: 'p-trifle', category_id: 'cat-postres', name: 'Trifle de Frutos Rojos',
    description: 'Capas de bizcocho, crema y frutos rojos frescos (fresa, mora y arándano) en copa individual.',
    price: 12900, image_url: img('1571877227200-a0d98ea607e9'),
    ingredients: ['Bizcocho', 'Fresa', 'Mora', 'Arándano', 'Crema de leche', 'Azúcar'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'bizcocho', qty: 80 }, { ingredientId: 'fresa', qty: 50 },
      { ingredientId: 'mora', qty: 40 }, { ingredientId: 'arandano', qty: 30 },
      { ingredientId: 'crema_leche', qty: 60 }, { ingredientId: 'azucar', qty: 20 },
    ],
    pairings: ['p-limhier'],
  },
  {
    id: 'p-brownie', category_id: 'cat-postres', name: 'Brownie con Helado',
    description: 'Brownie tibio de chocolate con nueces, coronado con una bola de helado de vainilla.',
    price: 13500, image_url: img('1606313564200-e75d5e30476c'),
    ingredients: ['Chocolate', 'Harina', 'Huevo', 'Mantequilla', 'Helado'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'chocolate', qty: 90 }, { ingredientId: 'harina', qty: 60 },
      { ingredientId: 'huevo', qty: 40 }, { ingredientId: 'mantequilla', qty: 40 },
      { ingredientId: 'helado', qty: 80 }, { ingredientId: 'azucar', qty: 50 },
    ],
    pairings: ['p-limcoco'],
  },
  {
    id: 'p-cheese', category_id: 'cat-postres', name: 'Cheesecake de Maracuyá',
    description: 'Cheesecake cremoso sobre base de galleta, bañado con coulis de maracuyá natural.',
    price: 13900, image_url: img('1524351199679-46cddf530c04'),
    ingredients: ['Galleta', 'Queso crema', 'Maracuyá', 'Crema de leche', 'Azúcar'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'galleta', qty: 70 }, { ingredientId: 'queso_crema', qty: 120 },
      { ingredientId: 'maracuya', qty: 60 }, { ingredientId: 'crema_leche', qty: 40 },
      { ingredientId: 'azucar', qty: 40 }, { ingredientId: 'mantequilla', qty: 30 },
    ],
    pairings: ['p-lulo'],
  },
  // ----------------- BEBIDAS -----------------
  {
    id: 'p-limhier', category_id: 'cat-bebidas', name: 'Limonada de Hierbabuena',
    description: 'Refrescante limonada natural batida con hierbabuena fresca y hielo.',
    price: 6500, image_url: img('1536256263959-770b48d82b0a'),
    ingredients: ['Limón', 'Hierbabuena', 'Agua', 'Azúcar', 'Hielo'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'limon', qty: 60 }, { ingredientId: 'hierbabuena', qty: 8 },
      { ingredientId: 'agua', qty: 250 }, { ingredientId: 'azucar', qty: 25 },
      { ingredientId: 'hielo', qty: 100 },
    ],
    pairings: ['p-emp', 'p-pizza'],
  },
  {
    id: 'p-limcoco', category_id: 'cat-bebidas', name: 'Limonada de Coco',
    description: 'Cremosa limonada de coco, dulce y refrescante, servida bien fría.',
    price: 7900, image_url: img('1546173159-315724a31696'),
    ingredients: ['Limón', 'Coco', 'Leche', 'Agua', 'Azúcar', 'Hielo'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'limon', qty: 50 }, { ingredientId: 'coco', qty: 80 },
      { ingredientId: 'leche', qty: 100 }, { ingredientId: 'agua', qty: 150 },
      { ingredientId: 'azucar', qty: 30 }, { ingredientId: 'hielo', qty: 100 },
    ],
    pairings: ['p-pollo', 'p-bandeja'],
  },
  {
    id: 'p-lulo', category_id: 'cat-bebidas', name: 'Jugo de Lulo',
    description: 'Jugo natural de lulo, esa fruta ácida y exótica colombiana, perfecta para acompañar tu plato.',
    price: 6900, image_url: img('1595981267035-7b04ca84a82d'),
    ingredients: ['Lulo', 'Agua', 'Azúcar', 'Hielo'],
    is_available: true, created_at: new Date().toISOString(),
    recipe: [
      { ingredientId: 'lulo', qty: 100 }, { ingredientId: 'agua', qty: 250 },
      { ingredientId: 'azucar', qty: 30 }, { ingredientId: 'hielo', qty: 100 },
    ],
    isOffer: true, offerLabel: 'Recomendado',
    pairings: ['p-emp', 'p-burger'],
  },
];

// Mapa rápido id -> producto
export const productById = new Map(mockProducts.map((p) => [p.id, p]));

// ============================================================================
// IN-MEMORY / LOCAL STORAGE ENGINE
// ============================================================================
const SESSIONS_KEY = 'ventum_sessions';
const ORDERS_KEY = 'ventum_orders';
const INVENTORY_KEY = 'ventum_inventory';

// ---- Sesiones / limpieza ----
export function runCleanupCycle() {
  const sessions = getStoredSessions();
  const orders = getStoredOrders();
  const now = Date.now();
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

  const validSessions = sessions.filter((session) => {
    if (session.status === 'paid' && session.paid_at) {
      const paidTime = new Date(session.paid_at).getTime();
      if (now - paidTime > FIFTEEN_MINUTES_MS) return false;
    }
    return true;
  });

  const validSessionIds = new Set(validSessions.map((s) => s.id));
  const validOrders = orders.filter((order) => validSessionIds.has(order.table_session_id));

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(validOrders));
}

export function getStoredSessions(): TableSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getStoredOrders(): Order[] {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function findOrCreateActiveSession(tableId: string): TableSession {
  runCleanupCycle();
  const sessions = getStoredSessions();
  let session = sessions.find((s) => s.table_id === tableId && s.status === 'active');

  if (!session) {
    const table = mockTables.find((t) => t.id === tableId);
    if (!table) throw new Error('Mesa no encontrada');
    session = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      table_id: tableId,
      store_id: mockStore.id,
      status: 'active',
      created_at: new Date().toISOString(),
      paid_at: null,
    };
    sessions.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  return session;
}

export function validateTablePasscode(tableId: string, passcode: string): boolean {
  const table = mockTables.find((t) => t.id === tableId);
  return table ? table.passcode === passcode : false;
}

// ============================================================================
// INVENTARIO (materia prima)
// ============================================================================
export function getInventory(): Ingredient[] {
  const data = localStorage.getItem(INVENTORY_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data) as Ingredient[];
      // Si cambió el catálogo (nuevos ingredientes), re-sembrar.
      if (parsed.length === mockIngredients.length) return parsed;
    } catch {
      /* re-seed */
    }
  }
  const seed = mockIngredients.map((i) => ({ ...i }));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(seed));
  return seed;
}

export function resetInventory(): Ingredient[] {
  const seed = mockIngredients.map((i) => ({ ...i }));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(seed));
  triggerLocalBroadcast('inventory_changed', { reset: true });
  return seed;
}

export function decrementInventoryForOrder(
  items: { productId: string; quantity: number }[]
) {
  const inventory = getInventory();
  const map = new Map(inventory.map((i) => [i.id, i]));

  items.forEach(({ productId, quantity }) => {
    const product = productById.get(productId);
    if (!product?.recipe) return;
    product.recipe.forEach(({ ingredientId, qty }) => {
      const ing = map.get(ingredientId);
      if (ing) ing.stock = Math.max(0, ing.stock - qty * quantity);
    });
  });

  const updated = Array.from(map.values());
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
  triggerLocalBroadcast('inventory_changed', { items });
  return updated;
}

// ============================================================================
// PEDIDOS
// ============================================================================
export function placeMockOrder(
  storeId: string,
  tableSessionId: string,
  items: { productId: string; quantity: number; notes: string }[],
  notes: string
): Order {
  runCleanupCycle();
  const orders = getStoredOrders();
  const sessions = getStoredSessions();

  const session = sessions.find((s) => s.id === tableSessionId);
  if (!session) throw new Error('Sesión no encontrada');
  if (session.status === 'paid') throw new Error('No se pueden agregar pedidos a una cuenta pagada');

  const activeOrdersForSession = orders.filter(
    (o) => o.table_session_id === tableSessionId && o.status !== 'cancelled'
  );
  if (activeOrdersForSession.length >= 2) {
    throw new Error('Límite excedido: Solo se permiten un máximo de 2 órdenes por mesa simultáneamente.');
  }

  let totalAmount = 0;
  let totalUnits = 0;
  const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const orderItems = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
    totalAmount += product.price * item.quantity;
    totalUnits += item.quantity;
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
      unit_price: product.price,
      notes: item.notes || null,
      created_at: new Date().toISOString(),
    };
  });

  // Carga actual de cocina (pedidos en pending/preparing en toda la tienda)
  const kitchenLoad = orders.filter(
    (o) => o.store_id === storeId && (o.status === 'pending' || o.status === 'preparing')
  ).length;
  const eta = estimateWaitMinutes(totalUnits, kitchenLoad);

  const newOrder: Order = {
    id: orderId,
    store_id: storeId,
    table_session_id: tableSessionId,
    status: 'pending',
    total_amount: Math.round(totalAmount),
    notes: notes || null,
    created_at: new Date().toISOString(),
    preparing_at: null,
    ready_at: null,
    eta_minutes: eta,
    items: orderItems,
  };

  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Mermar materia prima
  decrementInventoryForOrder(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  triggerLocalBroadcast('order_created', newOrder);
  return newOrder;
}

export function updateMockOrderStatus(orderId: string, status: OrderStatus): Order {
  const orders = getStoredOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) throw new Error('Pedido no encontrado');

  const order = orders[orderIdx];
  order.status = status;
  const nowIso = new Date().toISOString();

  if (status === 'preparing' && !order.preparing_at) {
    order.preparing_at = nowIso;
  }
  if (status === 'ready' && !order.ready_at) {
    order.ready_at = nowIso;
    // Registrar duración real (created -> ready) para el pronóstico de la IA
    const mins = (Date.now() - new Date(order.created_at).getTime()) / 60000;
    recordCookDuration(mins, new Date(order.created_at));
  }

  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  triggerLocalBroadcast('status_changed', order);
  return order;
}

export function payAndCloseSession(sessionId: string): TableSession {
  const sessions = getStoredSessions();
  const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIdx === -1) throw new Error('Sesión no encontrada');

  const now = new Date().toISOString();
  sessions[sessionIdx].status = 'paid';
  sessions[sessionIdx].paid_at = now;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  triggerLocalBroadcast('session_closed', { sessionId, paid_at: now });
  return sessions[sessionIdx];
}

// ============================================================================
// REALTIME (BroadcastChannel local que simula Supabase Realtime)
// ============================================================================
const localChannel = typeof window !== 'undefined' ? new BroadcastChannel('ventum_realtime') : null;

export function triggerLocalBroadcast(event: string, payload: any) {
  if (localChannel) localChannel.postMessage({ event, payload });
}

export function subscribeToLocalBroadcast(callback: (event: string, payload: any) => void) {
  if (!localChannel) return () => {};
  const listener = (e: MessageEvent) => callback(e.data.event, e.data.payload);
  localChannel.addEventListener('message', listener);
  return () => localChannel.removeEventListener('message', listener);
}
