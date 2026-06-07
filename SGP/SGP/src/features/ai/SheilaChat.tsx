import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import sgpApi from '../../lib/supabase';
import type { Order, Product } from '../../types';
import { askSheila, SHEILA_GREETING, waitMessageForOrders } from './sheilaClient';
import { formatCOP } from '../../utils/formatPrice';
import notificationService from '../../services/notifications';
import { Sparkles, X, Send, Plus, Flame, Salad, Check } from 'lucide-react';

interface Msg {
  role: 'sheila' | 'user';
  text: string;
  suggestions?: Product[];
}

// Renderiza **negritas** y saltos de línea de forma segura.
function renderRich(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={j} className="font-bold text-brand-700">{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p}</span>
          )
        )}
      </p>
    );
  });
}

export const SheilaChat: React.FC = () => {
  const { addToCart, activeSession } = useApp();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Msg[]>([{ role: 'sheila', text: SHEILA_GREETING }]);
  const waitShownRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // Mensaje proactivo: si un pedido lleva ≥15 min sin estar listo.
  useEffect(() => {
    if (!activeSession) return;
    const check = async () => {
      const { data } = await sgpApi.getSessionOrders(activeSession.id);
      const msg = waitMessageForOrders(data ?? []);
      if (msg && !waitShownRef.current) {
        waitShownRef.current = true;
        setMessages((prev) => [...prev, { role: 'sheila', text: msg }]);
        if (!open) setUnread((u) => u + 1);
        notificationService.playChime('notification');
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [activeSession, open]);

  const pushAndAsk = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    let sessionOrders: Order[] = [];
    if (activeSession) {
      const { data } = await sgpApi.getSessionOrders(activeSession.id);
      sessionOrders = data ?? [];
    }
    const res = await askSheila(text, { sessionOrders });
    setMessages((prev) => [...prev, { role: 'sheila', text: res.text, suggestions: res.suggestions }]);
    setLoading(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    pushAndAsk(text);
  };

  const handleAdd = (product: Product) => {
    if (!activeSession) return;
    addToCart(product, 1, '');
    notificationService.playChime('notification');
    setAddedIds((prev) => new Set(prev).add(product.id));
  };

  const toggle = () => {
    setOpen((o) => !o);
    setUnread(0);
  };

  return (
    <>
      {/* Burbuja flotante (abajo a la derecha) */}
      <button
        onClick={toggle}
        aria-label="Abrir chat con Sheila"
        className="fixed bottom-5 right-5 z-50 w-16 h-16 rounded-full bg-brand-700 hover:bg-brand-600 text-cream shadow-2xl shadow-brand-900/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer border-2 border-brand-300/30"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-brand-950 text-[10px] font-black flex items-center justify-center border border-cream animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {/* Panel del chat */}
      {open && (
        <div className="fixed z-50 bottom-24 right-5 left-5 sm:left-auto sm:w-[370px] max-h-[72vh] bg-cream rounded-3xl shadow-2xl shadow-brand-950/40 border border-brand-200 flex flex-col overflow-hidden animate-pop-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900 to-brand-700 text-cream px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-cream/15 border border-cream/25 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold leading-tight">Sheila</h3>
              <p className="text-[10px] text-brand-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Mesera digital · en línea
              </p>
            </div>
            <button onClick={toggle} className="text-cream/70 hover:text-cream cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-cream">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-brand-700 text-cream rounded-br-md'
                        : 'bg-white text-brand-950 border border-brand-100 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {renderRich(m.text)}
                  </div>

                  {/* Tarjetas de sugerencia */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {m.suggestions.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 bg-white border border-brand-100 rounded-2xl p-2 shadow-sm">
                          {p.image_url && (
                            <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover shrink-0" loading="lazy" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-brand-950 truncate">{p.name}</p>
                            <p className="text-[11px] text-brand-600 font-semibold">{formatCOP(p.price)}</p>
                          </div>
                          <button
                            onClick={() => handleAdd(p)}
                            disabled={addedIds.has(p.id)}
                            className="shrink-0 w-8 h-8 rounded-full bg-brand-700 hover:bg-brand-600 text-cream flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:bg-emerald-600"
                          >
                            {addedIds.has(p.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-brand-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Chips rápidos */}
          <div className="flex gap-2 px-3.5 pt-2 pb-1 shrink-0">
            <button
              onClick={() => pushAndAsk('Ver ofertas del día')}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-accent-500/15 text-accent-600 border border-accent-500/30 px-3 py-1.5 rounded-full hover:bg-accent-500/25 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" /> Ofertas del día
            </button>
            <button
              onClick={() => pushAndAsk('Tengo restricciones alimenticias')}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-brand-500/10 text-brand-700 border border-brand-500/25 px-3 py-1.5 rounded-full hover:bg-brand-500/20 transition-all cursor-pointer"
            >
              <Salad className="w-3.5 h-3.5" /> Restricciones
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 pt-1.5 shrink-0 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escríbele a Sheila..."
              className="flex-1 bg-white border border-brand-200 rounded-full px-4 py-2.5 text-[13px] text-brand-950 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-brand-700 hover:bg-brand-600 text-cream flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SheilaChat;
