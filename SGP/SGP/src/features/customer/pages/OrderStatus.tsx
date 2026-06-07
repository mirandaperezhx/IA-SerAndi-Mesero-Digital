import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import useRealtimeOrders from '../../../hooks/useRealtimeOrders';
import type { OrderStatus as StatusType } from '../../../types';
import { CheckCircle2, Flame, BellRing, Utensils, CreditCard, LogOut, ChevronLeft, RefreshCw } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const OrderStatus: React.FC = () => {
  const navigate = useNavigate();
  const { activeTable, activeSession, exitTable, checkTableSessionStatus } = useApp();
  
  // Custom hook subscribing to live Broadcast events for this session
  const { orders, loading, refreshOrders } = useRealtimeOrders(undefined, activeSession?.id);
  const [countdownText, setCountdownText] = useState('15:00');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Redirect if session is missing
  useEffect(() => {
    if (!activeSession || !activeTable) {
      navigate('/');
    }
  }, [activeSession, activeTable, navigate]);

  // Sync session status to check payment state
  useEffect(() => {
    const interval = setInterval(() => {
      checkTableSessionStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkTableSessionStatus]);

  // Handle the 15-minute countdown clock if session status is "paid"
  useEffect(() => {
    if (activeSession && activeSession.status === 'paid' && activeSession.paid_at) {
      const paidTime = new Date(activeSession.paid_at).getTime();
      const calculateTimeLeft = () => {
        const now = Date.now();
        const diffMs = (paidTime + 15 * 60 * 1000) - now;
        
        if (diffMs <= 0) {
          exitTable();
          navigate('/');
          return 0;
        }
        return Math.floor(diffMs / 1000);
      };

      const initialSecs = calculateTimeLeft();
      setSecondsRemaining(initialSecs);

      const timer = setInterval(() => {
        setSecondsRemaining(prev => {
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

  // Formats seconds into MM:SS
  useEffect(() => {
    if (secondsRemaining !== null) {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      setCountdownText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
  }, [secondsRemaining]);

  // Send desktop notification when order transitions to "ready"
  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        if (order.status === 'ready') {
          // Play sound
          notificationService.playChime('notification');
          // Desktop Push
          notificationService.sendDesktopNotification(
            '¡Pedido Listo!',
            `Tu pedido de la ${activeTable?.name || 'Mesa'} está listo. El mesero se acerca a entregarlo.`
          );
        }
      });
    }
  }, [orders, activeTable]);

  if (!activeTable || !activeSession) return null;

  const totalBill = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0);

  // Translates statuses to steps
  const getStatusStep = (status: StatusType): number => {
    switch (status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'pending': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'preparing': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'ready': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'delivered': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  const getStatusLabel = (status: StatusType) => {
    switch (status) {
      case 'pending': return 'Recibido';
      case 'preparing': return 'En Cocina';
      case 'ready': return 'Listo / En entrega';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 pb-12">
      {/* Header bar */}
      <header className="sticky top-0 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-4 py-3.5 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al Menú
          </button>
          <div className="text-center">
            <h2 className="text-xs text-slate-400 dark:text-slate-500">Historial</h2>
            <p className="text-sm font-bold dark:text-slate-100">{activeTable.name}</p>
          </div>
          <button
            onClick={() => refreshOrders()}
            className="p-1 text-slate-400 hover:text-brand-500 transition-all"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main tracker frame */}
      <main className="max-w-md mx-auto px-4 mt-6">
        
        {/* LEYENDA CUENTA PAGADA COUNTDOWN */}
        {activeSession.status === 'paid' && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-brand-500/30 shadow-xl shadow-brand-500/5 mb-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/25 flex items-center justify-center mx-auto mb-3 text-brand-400">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-brand-400">¡Cuenta Pagada con Éxito!</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Muchas gracias por tu visita. Esta pantalla se cerrará automáticamente en:
            </p>
            
            {/* Live Clock Timer */}
            <div className="text-3xl font-black font-mono tracking-wider text-white mt-4 bg-slate-950/80 border border-slate-800 max-w-[120px] mx-auto py-2.5 rounded-2xl shadow-inner shadow-brand-500/5">
              {countdownText}
            </div>

            <button
              onClick={() => {
                exitTable();
                navigate('/');
              }}
              className="mt-6 flex items-center gap-2 justify-center mx-auto bg-slate-800 hover:bg-rose-900/20 border border-slate-700/60 hover:border-rose-500/30 text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-slate-350 hover:text-rose-400 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir Ahora
            </button>
          </div>
        )}

        {/* Status loop stack */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs mt-3">Cargando pedidos de la mesa...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tus Pedidos en Curso</h4>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Total acumulado: <strong className="text-slate-900 dark:text-white">${totalBill.toFixed(2)}</strong>
              </span>
            </div>

            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/80 rounded-2xl p-5 shadow-sm animate-fade-in"
              >
                {/* Order Top Summary */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block">
                      Código: #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Progress Visual Timeline Bar */}
                {order.status !== 'cancelled' && (
                  <div className="flex justify-between items-center px-2 mb-6 relative">
                    {/* Connecting line */}
                    <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-neutral-800 -z-0">
                      <div
                        className="h-full bg-brand-500 transition-all duration-500"
                        style={{
                          width: `${((getStatusStep(order.status) - 1) / 3) * 100}%`
                        }}
                      />
                    </div>

                    {/* Step 1: Received */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        getStatusStep(order.status) >= 1
                          ? 'bg-brand-500 text-slate-950 border-brand-500 font-extrabold'
                          : 'bg-slate-100 dark:bg-neutral-850 border-slate-200 dark:border-neutral-855 text-slate-400'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400">Recibido</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        getStatusStep(order.status) >= 2
                          ? 'bg-brand-500 text-slate-950 border-brand-500 font-extrabold'
                          : 'bg-slate-100 dark:bg-neutral-850 border-slate-200 dark:border-neutral-855 text-slate-400'
                      }`}>
                        <Flame className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400">Cocina</span>
                    </div>

                    {/* Step 3: Ready */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        getStatusStep(order.status) >= 3
                          ? 'bg-brand-500 text-slate-950 border-brand-500 font-extrabold'
                          : 'bg-slate-100 dark:bg-neutral-850 border-slate-200 dark:border-neutral-855 text-slate-400'
                      }`}>
                        <BellRing className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400">Listo</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        getStatusStep(order.status) >= 4
                          ? 'bg-brand-500 text-slate-950 border-brand-500 font-extrabold'
                          : 'bg-slate-100 dark:bg-neutral-850 border-slate-200 dark:border-neutral-855 text-slate-400'
                      }`}>
                        <Utensils className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-550 dark:text-slate-400">Entregado</span>
                    </div>
                  </div>
                )}

                {/* Items lists */}
                <div className="space-y-2 mt-4 bg-slate-50 dark:bg-neutral-950/40 p-3 rounded-xl">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 dark:border-neutral-800/30 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">
                          {item.quantity}x
                        </span>{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {item.product_name}
                        </span>
                        {item.notes && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-500 italic mt-0.5">
                            * {item.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-650 dark:text-slate-400">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                {order.notes && (
                  <div className="mt-3.5 text-[11px] text-slate-500 border-t border-slate-100 dark:border-neutral-850 pt-2.5">
                    <span className="font-bold">Observación:</span> "{order.notes}"
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                  <span className="text-xs text-slate-400">Monto del pedido</span>
                  <span className="text-sm font-bold text-brand-650 dark:text-brand-400">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
            <Utensils className="w-10 h-10 mx-auto mb-2 text-slate-350 dark:text-neutral-750" />
            <p className="text-sm font-semibold">No has realizado pedidos aún</p>
            <p className="text-xs mt-1">Explora nuestro menú para agregar tus platos favoritos.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderStatus;
