import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import useRealtimeOrders from '../../../hooks/useRealtimeOrders';
import sgpApi from '../../../lib/supabase';
import { mockTables, getStoredSessions } from '../../../services/mockData';
import type { Table, TableSession } from '../../../types';
import { Bell, LogOut, CheckCircle2, User, RefreshCw, DollarSign, X } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const WaiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { staffRole, logoutStaff, store } = useApp();

  // Active orders query (listens to realtime updates)
  const { orders, refreshOrders } = useRealtimeOrders(store?.id);
  
  const [activeSessions, setActiveSessions] = useState<TableSession[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Authentication Lock
  useEffect(() => {
    if (!staffRole || (staffRole !== 'waiter' && staffRole !== 'admin')) {
      navigate('/login');
    }
  }, [staffRole, navigate]);

  // Load and subscribe to active sessions
  const fetchSessions = async () => {
    // In mock mode we read stored sessions. In production we query database table_sessions
    const sessions = getStoredSessions();
    setActiveSessions(sessions);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Poll session statuses for simulation
    return () => clearInterval(interval);
  }, []);

  // Listen to live broadcast order notifications
  useEffect(() => {
    const unsubscribe = sgpApi.subscribeToBroadcast((event, payload) => {
      if (event === 'order_created' && payload.store_id === store?.id) {
        notificationService.playChime('notification');
        refreshOrders();
      }
      if (event === 'status_changed' || event === 'session_closed') {
        refreshOrders();
        fetchSessions();
      }
    });
    return () => unsubscribe();
  }, [store]);

  if (!staffRole || (staffRole !== 'waiter' && staffRole !== 'admin')) return null;

  const handleLogout = () => {
    logoutStaff();
    navigate('/login');
  };

  // Helper to determine status color and state of a table card
  const getTableState = (tableId: string) => {
    const session = activeSessions.find(s => s.table_id === tableId && s.status === 'active');
    const paidSession = activeSessions.find(s => s.table_id === tableId && s.status === 'paid');
    
    if (paidSession && paidSession.paid_at) {
      const paidTime = new Date(paidSession.paid_at).getTime();
      const minsLeft = 15 - ((Date.now() - paidTime) / (1000 * 60));
      if (minsLeft > 0) {
        return {
          status: 'paid',
          label: `Pagado (${Math.ceil(minsLeft)}m)`,
          color: 'bg-neutral-800 border-amber-500/40 text-amber-500'
        };
      }
    }

    if (!session) {
      return {
        status: 'empty',
        label: 'Vacía',
        color: 'bg-neutral-900 border-neutral-800 text-slate-500'
      };
    }

    // Check if table has dishes waiting in "ready"
    const sessionOrders = orders.filter(o => o.table_session_id === session.id);
    const hasReady = sessionOrders.some(o => o.status === 'ready');

    if (hasReady) {
      return {
        status: 'ready',
        label: '¡Listo para entregar!',
        color: 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 animate-pulse font-extrabold'
      };
    }

    return {
      status: 'active',
      label: 'Consumiendo',
      color: 'bg-indigo-950/20 border-indigo-500/40 text-indigo-300 font-semibold'
    };
  };

  // Gather details for selected table details pane
  const activeSessionForSelected = selectedTable
    ? activeSessions.find(s => s.table_id === selectedTable.id && s.status === 'active')
    : null;

  const paidSessionForSelected = selectedTable
    ? activeSessions.find(s => s.table_id === selectedTable.id && s.status === 'paid')
    : null;

  const currentSession = activeSessionForSelected || paidSessionForSelected;

  const selectedTableOrders = currentSession
    ? orders.filter(o => o.table_session_id === currentSession.id)
    : [];

  const totalAmountSelected = selectedTableOrders.reduce(
    (sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0
  );

  const handleDeliverAll = async (orderId: string) => {
    try {
      await sgpApi.updateOrderStatus(orderId, 'delivered');
      notificationService.playChime('success');
      refreshOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckoutTable = async (sessionId: string) => {
    if (!window.confirm('¿Confirmar cobro de la cuenta y cerrar la sesión de esta mesa? Se iniciará el temporizador de 15 minutos.')) return;
    try {
      await sgpApi.payAndCloseSession(sessionId);
      notificationService.playChime('success');
      fetchSessions();
      refreshOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white">SGP Panel de Operaciones</h1>
            <p className="text-[10px] text-brand-400">Rol: Mesero/Administrador</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { refreshOrders(); fetchSessions(); }}
            className="p-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 px-3.5 py-1.5 rounded-xl transition-all font-semibold active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: 15 Tables grid */}
        <main className="flex-1 p-6 overflow-y-auto border-r border-neutral-900">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Mapa de Mesas</h2>
            <div className="flex gap-4 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-750 inline-block"></span> Vacía</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Activa</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Entrega</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pagada</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockTables.map(table => {
              const state = getTableState(table.id);
              const isSelected = selectedTable?.id === table.id;

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`border rounded-2xl p-4 flex flex-col justify-between h-28 transition-all cursor-pointer shadow-sm active:scale-97 ${state.color} ${
                    isSelected ? 'ring-2 ring-brand-500 shadow-brand-500/5' : 'hover:scale-[1.02]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-black">{table.name}</span>
                      <span className="text-[9px] text-slate-500">QR: {table.passcode}</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1 block">
                      {state.label}
                    </span>
                  </div>

                  {/* Ready notifications counts */}
                  {state.status === 'ready' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black self-end">
                      🛎️
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Side: Selected table detailed controller */}
        <aside className="w-full md:w-80 lg:w-96 bg-neutral-900 p-6 overflow-y-auto flex flex-col shrink-0">
          {selectedTable ? (
            <div className="flex flex-col h-full justify-between animate-fade-in">
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-md font-black text-white">{selectedTable.name}</h3>
                    <p className="text-[10px] text-slate-400">Código de mesa: {selectedTable.passcode}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="p-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {currentSession ? (
                  <>
                    {/* Session status banner */}
                    <div className={`p-3 rounded-xl text-center text-xs font-semibold mb-4 border ${
                      currentSession.status === 'paid'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      Sesión: {currentSession.status === 'paid' ? 'CUENTA COBRADA / PAGADA' : 'CLIENTES CONSUMIENDO'}
                    </div>

                    {/* Orders listing */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Historial de Pedidos</h4>
                      
                      {selectedTableOrders.length > 0 ? (
                        selectedTableOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-neutral-850 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-center text-[10px] border-b border-neutral-800 pb-2 mb-2">
                              <span className="font-semibold text-slate-400">#{order.id.slice(-6).toUpperCase()}</span>
                              <span className="font-bold text-slate-500">{order.status.toUpperCase()}</span>
                            </div>

                            {/* Food items */}
                            <div className="space-y-1.5 text-xs text-slate-300">
                              {order.items?.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{item.quantity}x {item.product_name}</span>
                                  <span className="text-slate-400">${(item.unit_price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Delivery Action trigger */}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => handleDeliverAll(order.id)}
                                className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Entregar a la Mesa
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No hay pedidos agregados en esta sesión.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs italic">
                    Esta mesa no tiene clientes en sesión activa.
                  </div>
                )}
              </div>

              {/* Session billing operations */}
              {currentSession && (
                <div className="border-t border-neutral-800 pt-6 mt-6 bg-neutral-900">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-xs font-semibold text-slate-400">Subtotal de la cuenta</span>
                    <span className="text-lg font-black text-white">${totalAmountSelected.toFixed(2)}</span>
                  </div>

                  {currentSession.status === 'active' ? (
                    <button
                      onClick={() => handleCheckoutTable(currentSession.id)}
                      disabled={selectedTableOrders.length === 0}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-97 ${
                        selectedTableOrders.length > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/10'
                          : 'bg-neutral-800 text-neutral-600 border border-neutral-750 cursor-not-allowed'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Cobrar y Limpiar Mesa (Iniciar 15m)
                    </button>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-xl text-center text-[10px] font-bold">
                      💳 Cuenta cobrada. El temporizador de 15 minutos está corriendo en el cliente.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <User className="w-8 h-8 text-neutral-700 mb-2" />
              <p className="text-xs">Selecciona una mesa en el mapa para gestionar pedidos, entregas o cobro de cuentas.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default WaiterDashboard;
