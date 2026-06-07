import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { X, Trash2, Plus, Minus, Send, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';
import notificationService from '../../../services/notifications';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrdersCount: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, activeOrdersCount }) => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, submitCartOrder } = useApp();
  
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitCartOrder(orderNotes);
      
      // Chime + Confetti success effects (Hackathon special)
      notificationService.playChime('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#10b981', '#059669', '#34d399']
      });

      onClose();
      navigate('/status');
    } catch (err: any) {
      setSubmitError(err.message || 'Error al enviar el pedido. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end justify-center">
      {/* Background click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet card */}
      <div className="relative w-full md:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col animate-slide-up shadow-2xl z-10">
        
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-500" />
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Mi Carrito</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {cart.length > 0 ? (
            <>
              {/* Product items loop */}
              <div className="flex flex-col gap-3">
                {cart.map((item, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.product.name}
                      </h4>
                      {item.notes && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 italic mt-0.5 max-w-[250px] truncate">
                          Nota: "{item.notes}"
                        </p>
                      )}
                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 block mt-1">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center border border-slate-150 dark:border-neutral-800 rounded-lg p-0.5 shrink-0 bg-slate-50 dark:bg-neutral-950">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateCartQuantity(item.product.id, item.quantity - 1);
                          } else {
                            removeFromCart(item.product.id);
                          }
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-slate-400" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="w-6 text-center text-xs font-bold dark:text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* General Order notes textbox */}
              <div className="mt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notas Generales del Pedido
                </label>
                <textarea
                  placeholder="Ej: Servir todo al centro, traer cubiertos extras..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-xs placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-transparent dark:text-slate-200"
                />
              </div>

              {/* Alert if order limit is exceeded */}
              {activeOrdersCount >= 2 && (
                <div className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-center">
                  ⚠️ Ya tienes 2 pedidos activos para esta mesa. Debes pagar tu cuenta antes de realizar un nuevo pedido.
                </div>
              )}

              {submitError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-center font-semibold">
                  ❌ {submitError}
                </div>
              )}
            </>
          ) : (
            <div className="my-auto py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-slate-350 dark:text-neutral-700 mb-2" />
              <p className="text-sm font-semibold">Tu carrito está vacío</p>
              <p className="text-xs mt-0.5">Explora el menú y agrega tus antojos.</p>
            </div>
          )}
        </div>

        {/* Footer Summary & Action */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 dark:border-neutral-800 p-4 shrink-0 bg-white dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-slate-500">Subtotal a pagar</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || activeOrdersCount >= 2}
              className={`w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                activeOrdersCount < 2 && !isSubmitting
                  ? 'bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-brand-500/10'
                  : 'bg-slate-100 dark:bg-neutral-850 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-neutral-800/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Enviando Pedido a Cocina...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirmar y Enviar Pedido
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
