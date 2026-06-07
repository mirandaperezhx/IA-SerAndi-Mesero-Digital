import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';
import { getPairings } from './dietEngine';
import { formatCOP } from '../../utils/formatPrice';
import notificationService from '../../services/notifications';
import { Plus, X, Sparkles, Check } from 'lucide-react';

// Carrusel que aparece a la izquierda de la burbuja de Sheila al agregar un
// producto al carrito, sugiriendo platos que combinan.
export const PairingCarousel: React.FC = () => {
  const { lastAddedProduct, addToCart, activeSession } = useApp();
  const [pairings, setPairings] = useState<Product[]>([]);
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!lastAddedProduct) return;
    const list = getPairings(lastAddedProduct.product.id);
    if (list.length === 0) return;
    setPairings(list);
    setAdded(new Set());
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [lastAddedProduct]);

  if (!visible || pairings.length === 0) return null;

  const handleAdd = (p: Product) => {
    if (!activeSession) return;
    addToCart(p, 1, '');
    notificationService.playChime('notification');
    setAdded((prev) => new Set(prev).add(p.id));
  };

  return (
    <div className="fixed z-40 bottom-24 right-5 left-5 sm:left-auto sm:bottom-5 sm:right-24 sm:w-80 bg-cream/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-brand-950/30 border border-brand-200 p-3 animate-carousel-in">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[11px] font-bold text-brand-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-500" />
          Sheila sugiere combinar con…
        </p>
        <button onClick={() => setVisible(false)} className="text-brand-400 hover:text-brand-700 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {pairings.map((p) => (
          <div key={p.id} className="shrink-0 w-32 bg-white border border-brand-100 rounded-2xl overflow-hidden shadow-sm">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover" loading="lazy" />
            )}
            <div className="p-2">
              <p className="text-[11px] font-bold text-brand-950 leading-tight line-clamp-2 min-h-[28px]">{p.name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] font-bold text-brand-600">{formatCOP(p.price)}</span>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={added.has(p.id)}
                  className="w-7 h-7 rounded-full bg-brand-700 hover:bg-brand-600 text-cream flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:bg-emerald-600"
                >
                  {added.has(p.id) ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PairingCarousel;
