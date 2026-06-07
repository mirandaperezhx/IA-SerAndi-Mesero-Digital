export type UserRole = 'client' | 'cook' | 'waiter' | 'admin';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type SessionStatus = 'active' | 'paid';

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  pin_code: string;
  created_at: string;
}

export interface Table {
  id: string;
  store_id: string;
  name: string;
  passcode: string;
  active: boolean;
  created_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  store_id: string;
  status: SessionStatus;
  created_at: string;
  paid_at: string | null;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Materia prima (inventario) y recetas
// ----------------------------------------------------------------------------
export type IngredientGroup =
  | 'frutas'
  | 'verduras'
  | 'legumbres'
  | 'carnes'
  | 'lacteos'
  | 'bebidas'
  | 'abarrotes';

// Alérgenos comunes detectables a partir de los ingredientes.
export type Allergen =
  | 'gluten'
  | 'lacteos'
  | 'huevo'
  | 'frutos_secos'
  | 'mani'
  | 'mariscos'
  | 'pescado'
  | 'soya'
  | 'alcohol';

export interface Ingredient {
  id: string;
  name: string;
  group: IngredientGroup;
  stock: number; // existencia actual
  capacity: number; // 100% de referencia
  unit: string; // ej: 'g', 'ml', 'und'
  allergens: Allergen[];
  animal: boolean; // true si es de origen animal (para dietas)
}

export interface RecipeItem {
  ingredientId: string;
  qty: number; // consumo por unidad de producto
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[]; // nombres legibles para UI
  is_available: boolean;
  created_at: string;
  // Extensiones IA / inventario
  recipe?: RecipeItem[];
  allergens?: Allergen[];
  diet?: string[]; // etiquetas derivadas (vegano, vegetariano, sin gluten, ...)
  isOffer?: boolean;
  offerLabel?: string;
  pairings?: string[]; // ids de productos que combinan
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string; // Hydrated for UI
  product_price?: number; // Hydrated for UI
  quantity: number;
  unit_price: number;
  notes: string | null;
}

export interface Order {
  id: string;
  store_id: string;
  table_session_id: string;
  table_name?: string; // Hydrated for UI
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  preparing_at?: string | null; // sello al iniciar preparación
  ready_at?: string | null; // sello al quedar listo
  eta_minutes?: number | null; // pronóstico calculado al ordenar
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}
