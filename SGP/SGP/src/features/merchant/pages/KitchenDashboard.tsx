import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import useRealtimeOrders from '../../../hooks/useRealtimeOrders';
import type { OrderStatus } from '../../../types';
import sgpApi from '../../../lib/supabase';
import { ChefHat, LogOut, Check, Flame, RefreshCw, Clock, Play } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const KitchenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { staffRole, logoutStaff, store } = useApp();

  // Custom hook listening to real-time events for this store
  const { orders, refreshOrders } = useRealtimeOrders(store?.id);

  // Authentication Lock
  useEffect(() => {
    if (!staffRole || (staffRole !== 'cook' && staffRole !== 'admin')) {
      navigate('/login');
    }
  }, [staffRole, navigate]);

  // Request notifications permission and trigger sounds on new orders
  useEffect(() => {
    notificationService.requestPermission();

    const unsubscribe = sgpApi.subscribeToBroadcast((event, payload) => {
      if (event === 'order_created' && payload.store_id === store?.id) {
        // Trigger chimes and desktop pushes
        notificationService.playChime('new-order');
        notificationService.sendDesktopNotification(
          '¡Nuevo Pedido!',
          `Ha ingresado un nuevo pedido para la ${payload.table_name || 'Mesa'}.`
        );
      }
    });

    return () => unsubscribe();
  }, [store]);

  if (!staffRole || (staffRole !== 'cook' && staffRole !== 'admin')) return null;

  // Filter orders by active kitchen columns
  const receivedOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus;
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else return;

    try {
      await sgpApi.updateOrderStatus(orderId, nextStatus);
      notificationService.playChime('success');
      // Locally updated by useRealtimeOrders listener hook
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleLogout = () => {
    logoutStaff();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <ChefHat className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white">SGP Monitor de Cocina</h1>
            <p className="text-[10px] text-brand-400">Establecimiento: {store?.name || 'Cargando...'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refreshOrders()}
            className="p-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <span className="text-xs bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl border border-brand-400 select-none">
            Modo: {staffRole.toUpperCase()}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Pantalla
          </button>
        </div>
      </header>

      {/* Main Column Grid layout */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Column 1: Received / Pending orders */}
        <div className="flex flex-col bg-neutral-900/40 border border-neutral-850 rounded-3xl p-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              Recibidos
            </h3>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold">
              {receivedOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {receivedOrders.map(order => (
              <div
                key={order.id}
                className="bg-neutral-850 border border-neutral-800/80 rounded-2xl p-4.5 shadow-md flex flex-col justify-between hover:border-sky-550 transition-all animate-fade-in"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-xs font-black bg-sky-500 text-slate-950 px-2.5 py-1 rounded-lg">
                      {order.table_name || 'Mesa'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* List of items */}
                  <div className="mt-4 space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-xs border-b border-neutral-800/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-extrabold text-sky-400">{item.quantity}x</span>{' '}
                        <span className="text-slate-100 font-medium">{item.product_name}</span>
                        {item.notes && (
                          <span className="block text-[10px] text-amber-500/90 italic font-medium mt-0.5 pl-1 border-l border-amber-500/25">
                            * {item.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 bg-neutral-900 p-2 rounded-xl text-[10px] text-slate-400 border border-neutral-800/50">
                      <strong>Observación:</strong> "{order.notes}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUpdateStatus(order.id, 'pending')}
                  className="mt-4 w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex justify-between items-center transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Iniciar Preparación</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}

            {receivedOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-neutral-600">
                <Check className="w-8 h-8 text-neutral-800 mb-2" />
                <p className="text-xs">Sin pedidos pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Preparing orders */}
        <div className="flex flex-col bg-neutral-900/40 border border-neutral-850 rounded-3xl p-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              En Preparación
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {preparingOrders.map(order => (
              <div
                key={order.id}
                className="bg-neutral-850 border border-neutral-800/80 rounded-2xl p-4.5 shadow-md flex flex-col justify-between hover:border-amber-500 transition-all animate-fade-in"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-xs font-black bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg">
                      {order.table_name || 'Mesa'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* List of items */}
                  <div className="mt-4 space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-xs border-b border-neutral-800/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-extrabold text-amber-400">{item.quantity}x</span>{' '}
                        <span className="text-slate-100 font-medium">{item.product_name}</span>
                        {item.notes && (
                          <span className="block text-[10px] text-amber-500/90 italic font-medium mt-0.5 pl-1 border-l border-amber-500/25">
                            * {item.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 bg-neutral-900 p-2 rounded-xl text-[10px] text-slate-400 border border-neutral-800/50">
                      <strong>Observación:</strong> "{order.notes}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUpdateStatus(order.id, 'preparing')}
                  className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex justify-between items-center transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Listo para Entrega</span>
                  <Flame className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {preparingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-neutral-600">
                <Flame className="w-8 h-8 text-neutral-800 mb-2" />
                <p className="text-xs">Sin platos al fuego</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready / History log */}
        <div className="flex flex-col bg-neutral-900/40 border border-neutral-850 rounded-3xl p-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              Listos (Reciente)
            </h3>
            <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {readyOrders.map(order => (
              <div
                key={order.id}
                className="bg-neutral-850 border border-neutral-800/80 rounded-2xl p-4.5 shadow-sm opacity-60 hover:opacity-100 transition-all animate-fade-in"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black bg-brand-500 text-slate-950 px-2 py-0.5 rounded-lg">
                    {order.table_name || 'Mesa'}
                  </span>
                  <span className="text-[10px] text-slate-400">Listo</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-350">
                      {item.quantity}x {item.product_name}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {readyOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-neutral-600">
                <ChefHat className="w-8 h-8 text-neutral-800 mb-2" />
                <p className="text-xs">Sin platos listos recientemente</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;
