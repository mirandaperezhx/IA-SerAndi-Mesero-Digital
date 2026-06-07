import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import useRealtimeOrders from '../../../hooks/useRealtimeOrders';
import type { Order, OrderStatus as StatusType } from '../../../types';
import { CheckCircle2, Flame, BellRing, Utensils, CreditCard, LogOut, ChevronLeft, RefreshCw, Clock, Sparkles } from 'lucide-react';
import notificationService from '../../../services/notifications';
import { formatCOP } from '../../../utils/formatPrice';
import { getRemainingMinutes } from '../../ai/waitForecast';
import { waitMessageForOrders } from '../../ai/sheilaClient';
import AiAssistant from '../../ai/AiAssistant';

export const OrderStatus: React.FC = () => {
  const navigate = useNavigate();
  const { activeTable, activeSession, exitTable, checkTableSessionStatus } = useApp();
  const { orders, loading, refreshOrders } = useRealtimeOrders(undefined, activeSession?.id);
  const [countdownText, setCountdownText] = useState('15:00');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession || !activeTable) navigate('/');
  }, [activeSession, activeTable, navigate]);

  useEffect(() => {
    const interval = setInterval(() => checkTableSessionStatus(), 5000);
    return () => clearInterval(interval);
  }, [checkTableSessionStatus]);

  // Countdown de 15 min cuando la cuenta está pagada
  useEffect(() => {
    if (activeSession?.status === 'paid' && activeSession.paid_at) {
      const paidTime = new Date(activeSession.paid_at).getTime();
      const calc = () => Math.floor((paidTime + 15 * 60 * 1000 - Date.now()) / 1000);
      setSecondsRemaining(calc());
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            exitTable();
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setSecondsRemaining(null);
    }
  }, [activeSession, exitTable, navigate]);

  useEffect(() => {
    if (secondsRemaining !== null) {
      const m = Math.floor(secondsRemaining / 60);
      const s = secondsRemaining % 60;
      setCountdownText(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
  }, [secondsRemaining]);

  // Notificar cuando un pedido queda listo
  useEffect(() => {
    if (orders.some((o) => o.status === 'ready')) {
      notificationService.playChime('notification');
      notificationService.sendDesktopNotification('¡Pedido listo! 🛎️', `Tu pedido de la ${activeTable?.name ?? 'mesa'} va en camino.`);
    }
  }, [orders, activeTable]);

  if (!activeTable || !activeSession) return null;

  const totalBill = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  const reassurance = waitMessageForOrders(orders);

  const step = (s: StatusType) => ({ pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 0 }[s] ?? 0);
  const statusBadge = (s: StatusType) => {
    const map: Record<StatusType, string> = {
      pending: 'bg-sky-100 text-sky-700 border-sky-200',
      preparing: 'bg-amber-100 text-amber-700 border-amber-200',
      ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      delivered: 'bg-brand-100 text-brand-700 border-brand-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return map[s];
  };
  const statusLabel = (s: StatusType) =>
    ({ pending: 'Recibido', preparing: 'En cocina', ready: 'Listo / en entrega', delivered: 'Entregado', cancelled: 'Cancelado' }[s]);

  const etaText = (o: Order) => {
    if (o.status === 'ready') return '🛎️ ¡Listo! El mesero va en camino.';
    if (o.status === 'delivered') return '✅ Entregado. ¡Buen provecho!';
    const rem = getRemainingMinutes(o);
    if (rem <= 1) return '⏳ Saliendo de cocina en cualquier momento...';
    return `⏳ Tiempo estimado restante: ~${rem} min`;
  };

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="sticky top-0 bg-cream/90 backdrop-blur-md border-b border-brand-200 px-4 py-3.5 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate('/menu')} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Menú
          </button>
          <div className="text-center">
            <h2 className="text-[10px] text-brand-400 uppercase tracking-wider">Seguimiento</h2>
            <p className="font-display text-base font-bold text-brand-800">{activeTable.name}</p>
          </div>
          <button onClick={() => refreshOrders()} className="p-1 text-brand-400 hover:text-brand-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-5">
        {/* Cuenta pagada */}
        {activeSession.status === 'paid' && (
          <div className="bg-brand-900 text-cream rounded-3xl p-6 mb-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-cream/10 border border-cream/20 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-cream">¡Cuenta pagada con éxito!</h3>
            <p className="text-xs text-brand-200 mt-2">Gracias por visitar Ventum. Esta pantalla se cerrará en:</p>
            <div className="text-3xl font-black font-mono tracking-wider mt-4 bg-brand-950/60 max-w-[120px] mx-auto py-2.5 rounded-2xl">{countdownText}</div>
            <button onClick={() => { exitTable(); navigate('/'); }} className="mt-5 inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-700 text-xs px-4 py-2.5 rounded-xl text-brand-100 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Salir ahora
            </button>
          </div>
        )}

        {/* Mensaje cálido de espera (≥15 min) */}
        {reassurance && (
          <div className="bg-accent-500/15 border border-accent-500/30 rounded-2xl p-4 mb-5 flex gap-3 animate-fade-in">
            <Sparkles className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
            <p className="text-xs text-accent-700 leading-relaxed">{reassurance}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-16 text-brand-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs mt-3">Cargando pedidos...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider">Tus pedidos</h4>
              <span className="text-xs text-brand-600">Total: <strong className="text-brand-900">{formatCOP(totalBill)}</strong></span>
            </div>

            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center border-b border-brand-50 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] text-brand-400 font-semibold block">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className="text-[10px] text-brand-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${statusBadge(order.status)}`}>{statusLabel(order.status)}</span>
                </div>

                {order.status !== 'cancelled' && (
                  <>
                    <div className="flex justify-between items-center px-2 mb-4 relative">
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-brand-100 -z-0">
                        <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${((step(order.status) - 1) / 3) * 100}%` }} />
                      </div>
                      {[{ i: 1, Ic: CheckCircle2, l: 'Recibido' }, { i: 2, Ic: Flame, l: 'Cocina' }, { i: 3, Ic: BellRing, l: 'Listo' }, { i: 4, Ic: Utensils, l: 'Entregado' }].map(({ i, Ic, l }) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 z-10">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${step(order.status) >= i ? 'bg-brand-600 text-cream border-brand-600' : 'bg-brand-50 border-brand-200 text-brand-300'}`}>
                            <Ic className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold text-brand-500">{l}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-brand-50/60 rounded-xl p-2.5 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="text-xs font-semibold text-brand-700">{etaText(order)}</span>
                    </div>
                  </>
                )}

                <div className="space-y-2 bg-brand-50/40 p-3 rounded-xl">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <span className="text-brand-900 font-medium">{item.quantity}x {item.product_name}</span>
                      <span className="text-brand-500 font-semibold">{formatCOP(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <p className="mt-3 text-[11px] text-brand-500 border-t border-brand-50 pt-2.5"><span className="font-bold">Nota:</span> "{order.notes}"</p>
                )}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-50">
                  <span className="text-xs text-brand-400">Monto del pedido</span>
                  <span className="text-sm font-bold text-brand-700">{formatCOP(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-brand-100 rounded-3xl p-12 text-center text-brand-400 shadow-sm">
            <Utensils className="w-10 h-10 mx-auto mb-2 text-brand-200" />
            <p className="text-sm font-semibold text-brand-600">Aún no has realizado pedidos</p>
            <p className="text-xs mt-1">Vuelve al menú para agregar tus platos.</p>
          </div>
        )}
      </main>

      <AiAssistant />
    </div>
  );
};

export default OrderStatus;
