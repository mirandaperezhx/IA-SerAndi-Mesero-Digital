import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { mockProducts, mockCategories, mockStore } from '../../../services/mockData';
import type { Product } from '../../../types';
import { Search, ShoppingBag, Plus, Minus, Info, X, Clipboard } from 'lucide-react';
import CartDrawer from '../components/CartDrawer';
import sgpApi from '../../../lib/supabase';
import notificationService from '../../../services/notifications';

export const CustomerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { activeTable, activeSession, cart, addToCart } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('cat-1'); // Default to 'Entradas'
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNotes, setModalNotes] = useState('');
  
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Verification checks for table session
  useEffect(() => {
    if (!activeSession || !activeTable) {
      navigate('/');
    } else {
      // Query how many active orders exist in this session
      const checkOrdersLimit = async () => {
        const { data } = await sgpApi.getSessionOrders(activeSession.id);
        if (data) {
          const nonCancelled = data.filter(o => o.status !== 'cancelled');
          setActiveOrdersCount(nonCancelled.length);
        }
      };
      checkOrdersLimit();

      // Listen for session closures or order updates
      const unsubscribe = sgpApi.subscribeToBroadcast((event, payload) => {
        if (event === 'session_closed' && payload.sessionId === activeSession.id) {
          // Direct route checking
          navigate('/status');
        }
        if (event === 'order_created' && payload.table_session_id === activeSession.id) {
          setActiveOrdersCount(prev => prev + 1);
        }
      });
      return () => unsubscribe();
    }
  }, [activeSession, activeTable, navigate]);

  if (!activeTable || !activeSession) return null;

  // Filters products based on Category & Search Queries
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = product.category_id === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (searchQuery.trim() !== '') {
      return matchesSearch;
    }
    return matchesCategory;
  });

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setModalNotes('');
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, modalQuantity, modalNotes);
    notificationService.playChime('notification');
    handleCloseProduct();
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 pb-28 relative">
      {/* Mobile Top Navigation / Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-4 py-3.5 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block animate-pulse"></span>
              {mockStore.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400 font-semibold">
                {activeTable.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Límite: {activeOrdersCount}/2 pedidos activos
              </span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/status')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Mis Pedidos
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-4 mt-4">
        
        {/* Banner Alert for limits */}
        {activeOrdersCount >= 2 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex gap-2 text-xs text-amber-600 dark:text-amber-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Límite de pedidos alcanzado</p>
              <p className="opacity-90 mt-0.5">Ya tienes 2 pedidos activos para esta mesa. Debes solicitar la cuenta para realizar nuevos pedidos.</p>
            </div>
          </div>
        )}

        {/* Search Bar Input */}
        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400 dark:text-neutral-500" />
          </span>
          <input
            type="text"
            placeholder="Buscar platos, postres, ingredientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:text-slate-100 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Horizontal Category Slider (Sticky underneath top nav) */}
        {!searchQuery && (
          <div className="relative mb-5">
            <div
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {mockCategories.map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-neutral-800/80 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Category Title / Search Results indicator */}
        <h3 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-3.5 px-0.5">
          {searchQuery 
            ? `Resultados para "${searchQuery}"`
            : mockCategories.find(c => c.id === selectedCategory)?.name
          }
        </h3>

        {/* Products Grid Stack */}
        <div className="flex flex-col gap-3.5">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800/60 rounded-2xl p-3 flex gap-3.5 shadow-sm active:scale-[0.99] hover:shadow-md transition-all cursor-pointer"
              >
                {/* Product Thumbnail */}
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    loading="lazy"
                  />
                )}
                
                {/* Details info */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      ${product.price.toFixed(2)}
                    </span>
                    
                    {/* Tiny Plus indicator */}
                    <div className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl p-8 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">No se encontraron productos</p>
              <p className="text-xs mt-1">Prueba escribiendo otra palabra o cambia de categoría.</p>
            </div>
          )}
        </div>
      </main>

      {/* FLOATING ACTION CART BAR (Customer Bottom Bar) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 z-30 bg-gradient-to-t from-slate-100/90 dark:from-neutral-950/90 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-brand-500 hover:bg-brand-600 active:scale-98 text-slate-950 font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-brand-500/20 flex justify-between items-center transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="bg-slate-950 text-brand-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                  {cartTotalItems}
                </span>
                <span className="text-sm">Ver Carrito</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                ${cartTotalPrice.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT SPECIFICATIONS POPUP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center p-0 md:p-4">
          {/* Modal box */}
          <div className="w-full md:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up shadow-2xl">
            {/* Header image / info block */}
            <div className="relative h-48 md:h-52 bg-slate-100 shrink-0">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <ShoppingBag className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <button
                onClick={handleCloseProduct}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/40 hover:bg-slate-950/60 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedProduct.name}
                </h3>
                <span className="text-md font-bold text-brand-600 dark:text-brand-400 shrink-0">
                  ${selectedProduct.price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Ingredients list badge block */}
              {selectedProduct.ingredients.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ingredientes principales
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.ingredients.map(ing => (
                      <span
                        key={ing}
                        className="text-[10px] bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Notes area */}
              <div className="mt-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Indicaciones especiales
                </label>
                <textarea
                  placeholder="Ej: Sin condimentos, término medio, aderezos al lado..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  maxLength={150}
                  rows={2}
                  className="w-full border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-transparent dark:text-slate-200"
                />
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t border-slate-100 dark:border-neutral-800 p-4 shrink-0 bg-white dark:bg-neutral-900 flex justify-between items-center gap-4">
              {/* Quantity clickers */}
              <div className="flex items-center border border-slate-200 dark:border-neutral-800 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold dark:text-slate-200">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(q => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add item button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-brand-500/10 text-xs flex justify-between items-center px-4 transition-all cursor-pointer active:scale-98"
              >
                <span>Agregar al Pedido</span>
                <span>${(selectedProduct.price * modalQuantity).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER Persistent View */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        activeOrdersCount={activeOrdersCount}
      />
    </div>
  );
};

export default CustomerMenu;
