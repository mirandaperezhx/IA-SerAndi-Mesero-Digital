import type { Store, Table, Category, Product, Order, TableSession, OrderStatus } from '../types';

// 1. MOCK STORE
export const mockStore: Store = {
  id: 'store-1-uuid',
  name: 'El Rincón del Sabor',
  slug: 'el-rincon-sabor',
  logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
  pin_code: '2580', // Master PIN code for staff login
  created_at: new Date().toISOString()
};

// 2. MOCK TABLES (Exactly 15 tables with passcodes 1001 to 1015)
export const mockTables: Table[] = Array.from({ length: 15 }, (_, i) => {
  const index = i + 1;
  return {
    id: `table-${index}-uuid`,
    store_id: mockStore.id,
    name: `Mesa ${index}`,
    passcode: (1000 + index).toString(), // '1001' to '1015'
    active: true,
    created_at: new Date().toISOString()
  };
});

// 3. MOCK CATEGORIES (Exactly 8 categories)
export const mockCategories: Category[] = [
  { id: 'cat-1', store_id: mockStore.id, name: 'Entradas', order_index: 1, created_at: new Date().toISOString() },
  { id: 'cat-2', store_id: mockStore.id, name: 'Ensaladas', order_index: 2, created_at: new Date().toISOString() },
  { id: 'cat-3', store_id: mockStore.id, name: 'Sopas', order_index: 3, created_at: new Date().toISOString() },
  { id: 'cat-4', store_id: mockStore.id, name: 'Platos Fuertes', order_index: 4, created_at: new Date().toISOString() },
  { id: 'cat-5', store_id: mockStore.id, name: 'Postres', order_index: 5, created_at: new Date().toISOString() },
  { id: 'cat-6', store_id: mockStore.id, name: 'Bebidas Frías', order_index: 6, created_at: new Date().toISOString() },
  { id: 'cat-7', store_id: mockStore.id, name: 'Bebidas Calientes', order_index: 7, created_at: new Date().toISOString() },
  { id: 'cat-8', store_id: mockStore.id, name: 'Bebidas con Alcohol', order_index: 8, created_at: new Date().toISOString() },
];

// 4. MOCK PRODUCTS (Exactly 3 per category = 24 items)
export const mockProducts: Product[] = [
  // Entradas
  {
    id: 'prod-1-1',
    category_id: 'cat-1',
    name: 'Tequeños Crujientes',
    description: 'Deditos de queso envueltos en masa crujiente, servidos con salsa tártara de la casa.',
    price: 8.50,
    image_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Queso blanco', 'Harina de trigo', 'Huevo', 'Salsa tártara'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-1-2',
    category_id: 'cat-1',
    name: 'Ceviche Clásico Carretillero',
    description: 'Pescado fresco marinado en limón sutil, ají limo, cebolla roja y cilantro. Servido con camote y choclo.',
    price: 14.00,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Pescado blanco', 'Limón', 'Cebolla roja', 'Ají limo', 'Camote', 'Choclo'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-1-3',
    category_id: 'cat-1',
    name: 'Bruschettas de Tomate y Albahaca',
    description: 'Pan de campo tostado con ajo, tomates cherry marinados, albahaca fresca y aceite de oliva virgen extra.',
    price: 9.00,
    image_url: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Pan artesanal', 'Tomates cherry', 'Albahaca', 'Ajo', 'Aceite de oliva'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Ensaladas
  {
    id: 'prod-2-1',
    category_id: 'cat-2',
    name: 'Ensalada César con Pollo Grillé',
    description: 'Lechuga romana crujiente, croutons de ajo, parmesano rallado y aderezo César cremoso de la casa con pechuga al grill.',
    price: 11.50,
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Pechuga de pollo', 'Lechuga romana', 'Queso parmesano', 'Pan tostado', 'Aderezo César'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2-2',
    category_id: 'cat-2',
    name: 'Ensalada Caprese de Búfala',
    description: 'Rodajas de mozzarella de búfala fresca, tomates maduros, pesto genovés artesanal y reducción de aceto balsámico.',
    price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Mozzarella de búfala', 'Tomate', 'Pesto de albahaca', 'Reducción balsámica'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2-3',
    category_id: 'cat-2',
    name: 'Ensalada de Quinoa y Aguacate',
    description: 'Quinoa orgánica, aguacate en cubos, pepino, tomate cherry, pimientos, menta fresca y vinagreta cítrica.',
    price: 10.50,
    image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Quinoa', 'Aguacate', 'Pepino', 'Tomate cherry', 'Pimiento', 'Menta', 'Limón'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Sopas
  {
    id: 'prod-3-1',
    category_id: 'cat-3',
    name: 'Crema de Tomates Rostizados',
    description: 'Tomates rostizados al horno lentamente con tomillo y ajo, licuados con crema fresca, servida con tostadas de queso fundido.',
    price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Tomates', 'Crema de leche', 'Ajo', 'Albahaca', 'Queso derretido'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3-2',
    category_id: 'cat-3',
    name: 'Sopa Miso con Tofu',
    description: 'Caldo tradicional japonés a base de pasta de miso, dashi, cubitos de tofu suave, algas wakame y cebollín fresco.',
    price: 7.50,
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Miso', 'Dashi', 'Tofu', 'Alga wakame', 'Cebollín'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3-3',
    category_id: 'cat-3',
    name: 'Consomé de Pollo Campero',
    description: 'Caldo de pollo sazonado con verduras de la estación, pollo deshilachado, fideos finos y cilantro picado.',
    price: 8.50,
    image_url: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Pollo', 'Zanahoria', 'Apio', 'Fideos', 'Cilantro'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Platos Fuertes
  {
    id: 'prod-4-1',
    category_id: 'cat-4',
    name: 'Lomo Saltado Criollo',
    description: 'Tiras de lomo fino salteadas al wok con cebolla, tomate, ají amarillo y un toque de pisco. Acompañado de papas fritas y arroz blanco.',
    price: 19.50,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Lomo de res', 'Cebolla roja', 'Tomate', 'Ají amarillo', 'Sillao', 'Papas fritas', 'Arroz'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4-2',
    category_id: 'cat-4',
    name: 'Salmón Grillado al Eneldo',
    description: 'Filete de salmón fresco cocido a la plancha con una salsa cremosa de eneldo, acompañado de espárragos salteados y puré rústico.',
    price: 22.00,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Salmón', 'Eneldo', 'Crema de leche', 'Espárragos', 'Papas'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4-3',
    category_id: 'cat-4',
    name: 'Risotto de Hongos Silvestres',
    description: 'Arroz arborio cremoso con una variedad de champiñones portobello y setas deshidratadas, mantecado con queso parmesano y trufa.',
    price: 18.00,
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Arroz arborio', 'Champiñones', 'Portobello', 'Queso parmesano', 'Aceite de trufa'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Postres
  {
    id: 'prod-5-1',
    category_id: 'cat-5',
    name: 'Volcán de Chocolate Fondant',
    description: 'Bizcocho tibio de chocolate relleno de fudge caliente derretido, servido con una bola de helado de vainilla francesa.',
    price: 8.50,
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Chocolate negro', 'Mantequilla', 'Huevo', 'Helado de vainilla'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5-2',
    category_id: 'cat-5',
    name: 'Cheesecake de Frutos Rojos',
    description: 'Base de galleta crujiente de mantequilla, crema suave de queso horneada, coronada con compota casera de fresas, moras y frambuesas.',
    price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Queso crema', 'Galletas María', 'Mantequilla', 'Frambuesas', 'Moras', 'Fresas'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5-3',
    category_id: 'cat-5',
    name: 'Tiramisú Classico Italiano',
    description: 'Bizcochos de soletilla embebidos en café expreso licoroso, cubiertos por una emulsión de queso mascarpone y espolvoreados con cacao.',
    price: 9.00,
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Mascarpone', 'Café espresso', 'Bizcocho soletilla', 'Licor Amaretto', 'Cacao en polvo'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Bebidas Frías
  {
    id: 'prod-6-1',
    category_id: 'cat-6',
    name: 'Limonada de Coco Refresh',
    description: 'Limonada batida con crema de coco cremosa, endulzada suavemente y servida frappé con ralladura de limón.',
    price: 5.50,
    image_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Limón', 'Crema de coco', 'Hielo', 'Jarabe simple'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6-2',
    category_id: 'cat-6',
    name: 'Jugo de Maracuyá Natural',
    description: 'Extracto de maracuyá fresco mezclado con agua filtrada y endulzado al gusto. Servido bien frío.',
    price: 4.50,
    image_url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Maracuyá', 'Jarabe simple', 'Agua', 'Hielo'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6-3',
    category_id: 'cat-6',
    name: 'Té Frío de Hibiscus y Frutos Rojos',
    description: 'Infusión helada de flor de Jamaica, arándanos, menta fresca y rodajas de naranja cítrica.',
    price: 4.80,
    image_url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Flor de Jamaica', 'Arándanos', 'Menta', 'Naranja', 'Hielo'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Bebidas Calientes
  {
    id: 'prod-7-1',
    category_id: 'cat-7',
    name: 'Cappuccino Italiano',
    description: 'Doble shot de café expreso con leche vaporizada y una espuma densa y cremosa de leche, espolvoreada con canela.',
    price: 4.20,
    image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Café espresso', 'Leche entera', 'Canela'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7-2',
    category_id: 'cat-7',
    name: 'Mocaccino Fudge Caliente',
    description: 'Café expreso, fudge de chocolate belga fundido y leche al vapor, coronado con crema batida casera.',
    price: 4.80,
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Espresso', 'Chocolate belga', 'Leche', 'Crema batida'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7-3',
    category_id: 'cat-7',
    name: 'Té Matcha Latte Orgánico',
    description: 'Matcha japonés orgánico batido tradicionalmente y mezclado con leche de almendras caliente y cremosa.',
    price: 5.20,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Matcha ceremonial', 'Leche de almendras', 'Miel de agave'],
    is_available: true,
    created_at: new Date().toISOString()
  },

  // Bebidas con Alcohol
  {
    id: 'prod-8-1',
    category_id: 'cat-8',
    name: 'Pisco Sour Tradicional',
    description: 'El clásico cóctel peruano. Pisco queirolo acholado, jarabe de goma, jugo de limón sutil y clara de huevo licuado con unas gotas de amargo de angostura.',
    price: 9.50,
    image_url: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Pisco', 'Limón', 'Jarabe de goma', 'Clara de huevo', 'Amargo de angostura'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-8-2',
    category_id: 'cat-8',
    name: 'Maracuyá Mojito Premium',
    description: 'Ron blanco, hojas de buena hierba fresca, azúcar de caña machacada, pulpa de maracuyá ácido y un chorro de soda helada.',
    price: 9.00,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Ron blanco', 'Maracuyá', 'Hierbabuena', 'Limón', 'Azúcar', 'Soda'],
    is_available: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-8-3',
    category_id: 'cat-8',
    name: 'Copa de Vino Tinto Malbec',
    description: 'Reserva especial de la casa de viñedo argentino, caracterizado por notas frutales y un final elegante y redondo.',
    price: 8.50,
    image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=400&q=80',
    ingredients: ['Vino tinto Malbec'],
    is_available: true,
    created_at: new Date().toISOString()
  }
];

// ============================================================================
// IN-MEMORY / LOCAL STORAGE ENGINE FOR THE HACKATHON DEMO
// ============================================================================

const SESSIONS_KEY = 'sgp_mock_sessions';
const ORDERS_KEY = 'sgp_mock_orders';

// Dynamic helper to clean expired table sessions (paid > 15 minutes ago)
export function runCleanupCycle() {
  const sessions = getStoredSessions();
  const orders = getStoredOrders();
  const now = Date.now();
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

  const validSessions = sessions.filter(session => {
    if (session.status === 'paid' && session.paid_at) {
      const paidTime = new Date(session.paid_at).getTime();
      if (now - paidTime > FIFTEEN_MINUTES_MS) {
        return false; // Remove session
      }
    }
    return true;
  });

  const validSessionIds = new Set(validSessions.map(s => s.id));
  const validOrders = orders.filter(order => validSessionIds.has(order.table_session_id));

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(validOrders));
}

// Low-level storage helpers
export function getStoredSessions(): TableSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getStoredOrders(): Order[] {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
}

// Business actions
export function findOrCreateActiveSession(tableId: string): TableSession {
  runCleanupCycle();
  const sessions = getStoredSessions();
  
  // Look for an existing active session for this table
  let session = sessions.find(s => s.table_id === tableId && s.status === 'active');
  
  if (!session) {
    const table = mockTables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');
    
    session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table_id: tableId,
      store_id: mockStore.id,
      status: 'active',
      created_at: new Date().toISOString(),
      paid_at: null
    };
    
    sessions.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  
  return session;
}

export function validateTablePasscode(tableId: string, passcode: string): boolean {
  const table = mockTables.find(t => t.id === tableId);
  return table ? table.passcode === passcode : false;
}

export function placeMockOrder(
  storeId: string,
  tableSessionId: string,
  items: { productId: string; quantity: number; notes: string }[],
  notes: string
): Order {
  runCleanupCycle();
  const orders = getStoredOrders();
  const sessions = getStoredSessions();
  
  const session = sessions.find(s => s.id === tableSessionId);
  if (!session) throw new Error('Session not found');
  if (session.status === 'paid') throw new Error('No se pueden agregar pedidos a una cuenta pagada');

  // Enforce Limit: Maximum of 2 active orders per table session
  const activeOrdersForSession = orders.filter(
    o => o.table_session_id === tableSessionId && o.status !== 'cancelled'
  );
  if (activeOrdersForSession.length >= 2) {
    throw new Error('Límite excedido: Solo se permiten un máximo de 2 órdenes por mesa simultáneamente.');
  }

  // Hydrate order details
  let totalAmount = 0;
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderItems = items.map(item => {
    const product = mockProducts.find(p => p.id === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const linePrice = product.price * item.quantity;
    totalAmount += linePrice;

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: item.quantity,
      unit_price: product.price,
      notes: item.notes || null,
      created_at: new Date().toISOString()
    };
  });

  const newOrder: Order = {
    id: orderId,
    store_id: storeId,
    table_session_id: tableSessionId,
    status: 'pending',
    total_amount: parseFloat(totalAmount.toFixed(2)),
    notes: notes || null,
    created_at: new Date().toISOString(),
    items: orderItems
  };

  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Trigger Local Broadcast (simulates Supabase Realtime Broadcast Channel)
  triggerLocalBroadcast('order_created', newOrder);

  return newOrder;
}

export function updateMockOrderStatus(orderId: string, status: OrderStatus): Order {
  const orders = getStoredOrders();
  const orderIdx = orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) throw new Error('Order not found');

  orders[orderIdx].status = status;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  const updatedOrder = orders[orderIdx];
  triggerLocalBroadcast('status_changed', updatedOrder);

  return updatedOrder;
}

export function payAndCloseSession(sessionId: string): TableSession {
  const sessions = getStoredSessions();
  const sessionIdx = sessions.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) throw new Error('Session not found');

  const now = new Date().toISOString();
  sessions[sessionIdx].status = 'paid';
  sessions[sessionIdx].paid_at = now;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  const updatedSession = sessions[sessionIdx];
  triggerLocalBroadcast('session_closed', { sessionId, paid_at: now });

  return updatedSession;
}

// Simulates real-time messaging using standard browser BroadcastChannel (highly scalable)
const localChannel = typeof window !== 'undefined' ? new BroadcastChannel('sgp_realtime_broadcast') : null;

export function triggerLocalBroadcast(event: string, payload: any) {
  if (localChannel) {
    localChannel.postMessage({ event, payload });
  }
}

export function subscribeToLocalBroadcast(callback: (event: string, payload: any) => void) {
  if (!localChannel) return () => {};
  
  const listener = (e: MessageEvent) => {
    callback(e.data.event, e.data.payload);
  };
  
  localChannel.addEventListener('message', listener);
  return () => {
    localChannel.removeEventListener('message', listener);
  };
}
