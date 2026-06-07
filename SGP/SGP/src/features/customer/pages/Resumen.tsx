import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { ChevronLeft, Plus, Minus, Trash2, Send, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';
import notificationService from '../../../services/notifications';
import confetti from 'canvas-confetti';
import { formatCOP } from '../../../utils/formatPrice';
import { estimateWaitMinutes } from '../../ai/waitForecast';
import AiAssistant from '../../ai/AiAssistant';

export const Resumen: React.FC = () => {
  const navigate = useNavigate();
  const { activeTable, activeSession, cart, updateCartQuantity, removeFromCart, submitCartOrder } = useApp();
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSession || !activeTable) navigate('/');
  }, [activeSession, activeTable, navigate]);

  if (!activeTable || !activeSession) return null;

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const eta = totalItems > 0 ? estimateWaitMinutes(totalItems, 0) : 0;

  const handleSend = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitCartOrder(orderNotes);
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
    <div className="min-h-screen bg-cream pb-40">
      <header className="sticky top-0 bg-cream/90 backdrop-blur-md border-b border-brand-200 px-4 py-3.5 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate('/menu')} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Volver al menú
          </button>
          <h2 className="font-display text-base font-bold text-brand-800">Tu pedido</h2>
          <span className="text-xs text-brand-500 font-semibold">{activeTable.name}</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-5">
        {cart.length === 0 ? (
          <div className="bg-white border border-dashed border-brand-200 rounded-3xl p-10 text-center text-brand-400 mt-8">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-brand-200" />
            <p className="text-sm font-semibold text-brand-600">Tu pedido está vacío</p>
            <p className="text-xs mt-1">Agrega platos desde el menú para enviarlos a cocina.</p>
            <button onClick={() => navigate('/menu')} className="mt-5 inline-flex items-center gap-1.5 bg-brand-700 hover:bg-brand-600 text-cream text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar algo
            </button>
          </div>
        ) : (
          <>
            {/* ETA estimada */}
            <div className="bg-brand-700 text-cream rounded-2xl p-4 mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-xs text-brand-200">Tiempo estimado de preparación</p>
                <p className="text-lg font-bold">~ {eta} minutos</p>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-brand-100 rounded-2xl divide-y divide-brand-50 mb-4">
              {cart.map((item, idx) => (
                <div key={`${item.product.id}-${idx}`} className="flex items-center gap-3 p-3">
                  {item.product.image_url && (
                    <img src={item.product.image_url} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover shrink-0" loading="lazy" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-950 truncate">{item.product.name}</p>
                    <p className="text-xs font-semibold text-brand-600">{formatCOP(item.product.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-brand-50 border border-brand-200 rounded-lg p-0.5 shrink-0">
                    <button
                      onClick={() => (item.quantity > 1 ? updateCartQuantity(item.product.id, item.quantity - 1) : removeFromCart(item.product.id))}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-brand-700 hover:bg-brand-100 cursor-pointer"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-brand-950">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-brand-700 hover:bg-brand-100 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Notas / alergias */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-brand-500 flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Notas y alergias
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Ej: Soy alérgico al maní, sin cebolla, término medio..."
                className="w-full border border-brand-200 rounded-xl p-3 text-xs text-brand-950 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 bg-white"
              />
              <p className="text-[10px] text-brand-400 mt-1">Las alergias se resaltarán en cocina para mayor cuidado.</p>
            </div>

            <button onClick={() => navigate('/menu')} className="w-full flex items-center justify-center gap-1.5 border border-brand-300 text-brand-700 text-xs font-bold py-3 rounded-xl hover:bg-brand-50 transition-all cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar algo más
            </button>
          </>
        )}
      </main>

      {/* Barra inferior enviar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 z-30 bg-gradient-to-t from-cream via-cream/95 to-transparent">
          <div className="max-w-md mx-auto">
            {error && <p className="text-xs text-red-600 text-center mb-2 font-semibold">{error}</p>}
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-brand-500">Total</span>
              <span className="text-lg font-black text-brand-800">{formatCOP(totalPrice)}</span>
            </div>
            <button
              onClick={handleSend}
              disabled={submitting}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-cream font-bold py-4 rounded-2xl shadow-xl shadow-brand-900/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando a cocina...' : 'Enviar a cocina'}
            </button>
          </div>
        </div>
      )}

      <AiAssistant />
    </div>
  );
};

export default Resumen;
