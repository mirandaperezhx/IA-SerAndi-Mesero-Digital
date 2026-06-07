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

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
  is_available: boolean;
  created_at: string;
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
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}
