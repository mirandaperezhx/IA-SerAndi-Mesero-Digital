import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { mockProducts, mockCategories } from '../../../services/mockData';
import type { Product } from '../../../types';
import { Search, Plus, Minus, Send, X, ArrowRight, Leaf, WheatOff } from 'lucide-react';
import sgpApi from '../../../lib/supabase';
import notificationService from '../../../services/notifications';
import confetti from 'canvas-confetti';
import { formatCOP } from '../../../utils/formatPrice';
import { getDietTags } from '../../ai/dietEngine';
import AiAssistant from '../../ai/AiAssistant';

export const CustomerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { store, activeTable, activeSession, cart, addToCart, updateCartQuantity, removeFromCart, submitCartOrder } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSession || !activeTable) {
      navigate('/');
      return;
    }
    const checkOrders = async () => {
      const { data } = await sgpApi.getSessionOrders(activeSession.id);
      if (data) setActiveOrdersCount(data.filter((o) => o.status !== 'cancelled').length);
    };
    checkOrders();
    const unsubscribe = sgpApi.subscribeToBroadcast((event, payload) => {
      if (event === 'session_closed' && payload.sessionId === activeSession.id) navigate('/status');
      if (event === 'order_created' && payload.table_session_id === activeSession.id) {
        setActiveOrdersCount((p) => p + 1);
      }
    });
    return () => unsubscribe();
  }, [activeSession, activeTable, navigate]);

  if (!activeTable || !activeSession) return null;

  const getQty = (productId: string) =>
    cart.find((i) => i.product.id === productId && i.notes === '')?.quantity ?? 0;

  const inc = (p: Product) => {
    const q = getQty(p.id);
    if (q === 0) addToCart(p, 1, '');
    else updateCartQuantity(p.id, q + 1);
  };
  const dec = (p: Product) => {
    const q = getQty(p.id);
    if (q <= 1) removeFromCart(p.id);
    else updateCartQuantity(p.id, q - 1);
  };

  const cartTotalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotalPrice = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const limitReached = activeOrdersCount >= 2;

  const matches = (p: Product) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = async () => {
    if (cart.length === 0 || submitting || limitReached) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCartOrder('');
      notificationService.playChime('success');
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.8 }, colors: ['#6b0f1e', '#a33a4a', '#d7b1b8'] });
      navigate('/status');
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-cream/90 backdrop-blur-md border-b border-brand-200 px-4 py-3 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-brand-700 leading-tight">{store?.name ?? 'Ventum'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] bg-brand-700 text-cream px-2 py-0.5 rounded-md font-semibold">{activeTable.name}</span>
              <span className="text-[10px] text-brand-500">Pedidos activos: {activeOrdersCount}/2</span>
            </div>
          </div>
          {/* Flecha al resumen */}
          <button
            onClick={() => navigate('/resumen')}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-700 hover:bg-brand-600 text-cream text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Resumen
            <ArrowRight className="w-4 h-4" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-500 text-brand-950 text-[10px] font-black flex items-center justify-center border border-cream">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4">
        {limitReached && (
          <div className="mb-4 bg-accent-500/15 border border-accent-500/30 rounded-2xl p-3.5 text-xs text-accent-600">
            <p className="font-bold">Límite de pedidos alcanzado</p>
            <p className="opacity-90 mt-0.5">Ya tienes 2 pedidos activos. Solicita la cuenta para pedir de nuevo.</p>
          </div>
        )}

        {/* Buscador */}
        <div className="relative mb-5">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-brand-300" />
          </span>
          <input
            type="text"
            placeholder="Buscar platos, ingredientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-3 bg-white border border-brand-200 rounded-2xl text-sm text-brand-950 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-300 hover:text-brand-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categorías hacia abajo */}
        {mockCategories.map((cat) => {
          const products = mockProducts.filter((p) => p.category_id === cat.id && matches(p));
          if (products.length === 0) return null;
          return (
            <section key={cat.id} className="mb-7">
              <h3 className="font-display text-xl font-bold text-brand-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-accent-500 rounded-full" />
                {cat.name}
              </h3>
              <div className="flex flex-col gap-3">
                {products.map((p) => {
                  const qty = getQty(p.id);
                  const tags = getDietTags(p);
                  return (
                    <div key={p.id} className="bg-white border border-brand-100 rounded-2xl p-3 flex gap-3 shadow-sm">
                      {p.image_url && (
                        <div className="relative shrink-0">
                          <img src={p.image_url} alt={p.name} className="w-24 h-24 rounded-xl object-cover" loading="lazy" />
                          {p.isOffer && (
                            <span className="absolute top-1 left-1 bg-accent-500 text-brand-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                              {p.offerLabel ?? 'Oferta'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-brand-950 leading-tight">{p.name}</h4>
                        <p className="text-[11px] text-brand-400 line-clamp-2 mt-0.5 leading-snug">{p.description}</p>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {tags.slice(0, 2).map((t) => (
                              <span key={t} className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                {t.includes('gluten') ? <WheatOff className="w-2.5 h-2.5" /> : <Leaf className="w-2.5 h-2.5" />}
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-auto pt-2">
                          <span className="text-sm font-bold text-brand-700">{formatCOP(p.price)}</span>
                          {qty === 0 ? (
                            <button
                              onClick={() => inc(p)}
                              className="flex items-center gap-1 bg-brand-700 hover:bg-brand-600 text-cream text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-brand-50 border border-brand-200 rounded-lg p-0.5">
                              <button onClick={() => dec(p)} className="w-7 h-7 rounded-md flex items-center justify-center text-brand-700 hover:bg-brand-100 cursor-pointer">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-brand-950">{qty}</span>
                              <button onClick={() => inc(p)} className="w-7 h-7 rounded-md flex items-center justify-center text-brand-700 hover:bg-brand-100 cursor-pointer">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Barra inferior: Enviar a cocina */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 z-30 bg-gradient-to-t from-cream via-cream/95 to-transparent">
          <div className="max-w-md mx-auto">
            {error && <p className="text-xs text-red-600 text-center mb-2 font-semibold">{error}</p>}
            <button
              onClick={handleSend}
              disabled={submitting || limitReached}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-cream font-bold py-4 px-5 rounded-2xl shadow-xl shadow-brand-900/20 flex justify-between items-center transition-all active:scale-98 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="bg-cream text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">{cartTotalItems}</span>
                {submitting ? 'Enviando...' : 'Enviar a cocina'}
              </span>
              <span className="flex items-center gap-2 text-sm font-black">
                {formatCOP(cartTotalPrice)}
                <Send className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Sheila + carrusel de maridaje */}
      <AiAssistant />
    </div>
  );
};

export default CustomerMenu;
