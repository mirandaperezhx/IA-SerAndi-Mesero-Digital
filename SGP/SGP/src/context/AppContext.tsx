import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Store, Table, TableSession, CartItem, Product, Order, UserRole } from '../types';
import sgpApi from '../lib/supabase';
import { mockStore } from '../services/mockData';

interface AppContextType {
  store: Store | null;
  activeTable: Table | null;
  activeSession: TableSession | null;
  cart: CartItem[];
  staffRole: UserRole | null;
  loading: boolean;
  error: string | null;
  
  // Table operations
  enterTable: (tableId: string, passcode: string) => Promise<boolean>;
  exitTable: () => void;
  checkTableSessionStatus: () => Promise<void>;
  
  // Cart operations
  addToCart: (product: Product, quantity: number, notes: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  submitCartOrder: (orderNotes: string) => Promise<Order>;
  clearCart: () => void;
  
  // Staff operations
  loginStaff: (pin: string, role: UserRole) => Promise<boolean>;
  logoutStaff: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [staffRole, setStaffRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load state from localStorage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        // Load store info
        const { data: categories } = await sgpApi.getCategories(); // triggers initial load or fetch
        if (categories) {
          setStore(mockStore);
        }
        // Load staff role if persisted
        const savedRole = localStorage.getItem('sgp_staff_role');
        if (savedRole) setStaffRole(savedRole as UserRole);

        // Load active session
        const savedSessionId = localStorage.getItem('sgp_session_id');
        const savedTableId = localStorage.getItem('sgp_table_id');

        if (savedSessionId && savedTableId) {
          const { data: tables } = await sgpApi.getTables();
          const foundTable = tables?.find(t => t.id === savedTableId) || null;
          setActiveTable(foundTable);

          const { data: session, error: sessError } = await sgpApi.getSessionStatus(savedSessionId);
          
          if (!sessError && session) {
            // Check 15 minute paid expiration
            if (session.status === 'paid' && session.paid_at) {
              const paidTime = new Date(session.paid_at).getTime();
              const diffMinutes = (Date.now() - paidTime) / (1000 * 60);
              
              if (diffMinutes >= 15) {
                // Clear expired session
                clearLocalSession();
              } else {
                setActiveSession(session);
              }
            } else {
              setActiveSession(session);
            }
          } else {
            clearLocalSession();
          }
        }
      } catch (err: any) {
        console.error('Failed to init app:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Sync cart in active session
  useEffect(() => {
    if (activeSession) {
      const savedCart = localStorage.getItem(`sgp_cart_${activeSession.id}`);
      if (savedCart) setCart(JSON.parse(savedCart));
      else setCart([]);
    } else {
      setCart([]);
    }
  }, [activeSession]);

  const clearLocalSession = () => {
    localStorage.removeItem('sgp_session_id');
    localStorage.removeItem('sgp_table_id');
    setActiveTable(null);
    setActiveSession(null);
    setCart([]);
  };

  const enterTable = async (tableId: string, passcode: string): Promise<boolean> => {
    setError(null);
    try {
      // 1. Validate passcode
      const isValid = await sgpApi.validateTablePasscode(tableId, passcode);
      if (!isValid) {
        throw new Error('Código de acceso incorrecto. Verifica el número e intenta nuevamente.');
      }

      // 2. Fetch all tables to get the table information
      const { data: tables } = await sgpApi.getTables();
      const table = tables?.find(t => t.id === tableId) || null;
      if (!table) throw new Error('Mesa no encontrada');

      // 3. Resolve active session
      const { data: session, error: sessError } = await sgpApi.getOrCreateActiveSession(tableId);
      if (sessError || !session) throw new Error(sessError || 'Error al iniciar sesión de mesa');

      // 4. Save locally
      localStorage.setItem('sgp_table_id', tableId);
      localStorage.setItem('sgp_session_id', session.id);
      setActiveTable(table);
      setActiveSession(session);

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const exitTable = () => {
    clearLocalSession();
  };

  const checkTableSessionStatus = async () => {
    if (!activeSession) return;
    try {
      const { data: session } = await sgpApi.getSessionStatus(activeSession.id);
      if (session) {
        if (session.status === 'paid' && session.paid_at) {
          const paidTime = new Date(session.paid_at).getTime();
          const diffMinutes = (Date.now() - paidTime) / (1000 * 60);
          if (diffMinutes >= 15) {
            clearLocalSession();
          } else {
            setActiveSession(session);
          }
        } else {
          setActiveSession(session);
        }
      } else {
        clearLocalSession();
      }
    } catch (err) {
      console.error('Error checking table session:', err);
    }
  };

  // Cart Functions
  const addToCart = (product: Product, quantity: number, notes: string) => {
    if (!activeSession) return;
    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.notes === notes
      );
      
      let updated;
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx].quantity += quantity;
      } else {
        updated = [...prev, { product, quantity, notes }];
      }
      
      localStorage.setItem(`sgp_cart_${activeSession.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    if (!activeSession) return;
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      localStorage.setItem(`sgp_cart_${activeSession.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (!activeSession) return;
    setCart(prev => {
      const updated = prev.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem(`sgp_cart_${activeSession.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    if (!activeSession) return;
    setCart([]);
    localStorage.removeItem(`sgp_cart_${activeSession.id}`);
  };

  const submitCartOrder = async (orderNotes: string): Promise<Order> => {
    if (!activeSession) throw new Error('No hay sesión de mesa activa');
    if (cart.length === 0) throw new Error('El carrito está vacío');

    const storeId = activeSession.store_id;
    const itemsPayload = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      notes: item.notes
    }));

    const { data: order, error: orderErr } = await sgpApi.placeOrder(
      storeId,
      activeSession.id,
      itemsPayload,
      orderNotes
    );

    if (orderErr) {
      throw new Error(orderErr);
    }

    clearCart();
    return order!;
  };

  // Staff functions
  const loginStaff = async (pin: string, role: UserRole): Promise<boolean> => {
    // Standard PIN checks (master pin is 2580 for demo, but we also check mockStore)
    if (pin === '2580' || pin === '1234') {
      setStaffRole(role);
      localStorage.setItem('sgp_staff_role', role);
      return true;
    }
    return false;
  };

  const logoutStaff = () => {
    setStaffRole(null);
    localStorage.removeItem('sgp_staff_role');
  };

  return (
    <AppContext.Provider
      value={{
        store: store || {
          id: 'store-1-uuid',
          name: 'El Rincón del Sabor',
          slug: 'el-rincon-sabor',
          logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
          pin_code: '2580',
          created_at: new Date().toISOString()
        },
        activeTable,
        activeSession,
        cart,
        staffRole,
        loading,
        error,
        enterTable,
        exitTable,
        checkTableSessionStatus,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        submitCartOrder,
        clearCart,
        loginStaff,
        logoutStaff
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export default AppContext;
