import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import sgpApi from '../../../lib/supabase';
import type { Ingredient, IngredientGroup, Order, Table } from '../../../types';
import { getInventory, resetInventory } from '../../../services/mockData';
import { generateShoppingListPdf } from '../../../services/shoppingListPdf';
import { generateTableQrDataUrl, tableQrTargetUrl } from '../../../services/qrService';
import SupplyBar from '../components/SupplyBar';
import { formatCOP } from '../../../utils/formatPrice';
import { getMealPeriod, mealPeriodLabel, type MealPeriod } from '../../ai/waitForecast';
import {
  LogOut, RefreshCw, Boxes, BarChart3, LayoutGrid, QrCode, CreditCard, FileDown,
  ChevronDown, TrendingUp, ShoppingCart, Clock, RotateCcw, Download, Check,
} from 'lucide-react';

type Tab = 'inventario' | 'metricas' | 'mesas' | 'qr' | 'suscripcion';

const GROUPS: { key: IngredientGroup; label: string; emoji: string }[] = [
  { key: 'frutas', label: 'Frutas', emoji: '🍓' },
  { key: 'verduras', label: 'Verduras', emoji: '🥬' },
  { key: 'legumbres', label: 'Legumbres', emoji: '🫘' },
  { key: 'carnes', label: 'Carnes', emoji: '🍖' },
  { key: 'lacteos', label: 'Lácteos', emoji: '🧀' },
  { key: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { key: 'abarrotes', label: 'Abarrotes', emoji: '🛒' },
];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { staffRole, logoutStaff, store } = useApp();
  const [tab, setTab] = useState<Tab>('metricas');
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['frutas']));

  useEffect(() => {
    if (staffRole !== 'admin') navigate('/login');
  }, [staffRole, navigate]);

  const reloadInventory = () => setInventory(getInventory());
  const reloadOrders = async () => {
    if (!store) return;
    const { data } = await sgpApi.getAllStoreOrders(store.id);
    setOrders(data ?? []);
  };

  useEffect(() => {
    reloadInventory();
    reloadOrders();
    const unsub = sgpApi.subscribeToBroadcast((event) => {
      if (event === 'inventory_changed') reloadInventory();
      if (event === 'order_created' || event === 'status_changed' || event === 'session_closed') {
        reloadOrders();
        reloadInventory();
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  if (staffRole !== 'admin') return null;

  const handleLogout = () => { logoutStaff(); navigate('/login'); };

  const tabs: { key: Tab; label: string; Icon: typeof Boxes }[] = [
    { key: 'metricas', label: 'Métricas', Icon: BarChart3 },
    { key: 'inventario', label: 'Inventario', Icon: Boxes },
    { key: 'mesas', label: 'Mesas', Icon: LayoutGrid },
    { key: 'qr', label: 'QR', Icon: QrCode },
    { key: 'suscripcion', label: 'Suscripción', Icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-cream flex flex-col">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-5 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Ventum" className="h-8" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <div>
            <h1 className="font-display text-lg font-bold text-cream leading-tight">Administración</h1>
            <p className="text-[10px] text-brand-300">{store?.name ?? 'Ventum'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-brand-600 text-cream font-bold px-3 py-1.5 rounded-xl">ADMIN</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 text-red-300 px-3.5 py-1.5 rounded-xl font-semibold cursor-pointer active:scale-95">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-neutral-900/60 border-b border-neutral-800 px-3 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${tab === key ? 'border-brand-400 text-cream' : 'border-transparent text-brand-300/70 hover:text-cream'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-5">
        {tab === 'metricas' && <MetricsTab orders={orders} onRefresh={reloadOrders} />}
        {tab === 'inventario' && (
          <InventoryTab inventory={inventory} openGroups={openGroups} setOpenGroups={setOpenGroups} onReload={reloadInventory} />
        )}
        {tab === 'mesas' && <TablesTab />}
        {tab === 'qr' && <QrTab slug={store?.slug ?? 'ventum'} />}
        {tab === 'suscripcion' && <SubscriptionTab />}
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MÉTRICAS
// ---------------------------------------------------------------------------
const MetricsTab: React.FC<{ orders: Order[]; onRefresh: () => void }> = ({ orders, onRefresh }) => {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const valid = orders.filter((o) => o.status !== 'cancelled' && new Date(o.created_at).toDateString() === today);
    const totalSales = valid.reduce((s, o) => s + o.total_amount, 0);
    const count = valid.length;
    const avg = count ? totalSales / count : 0;

    const dishMap = new Map<string, number>();
    const periodCount: Record<MealPeriod, number> = { almuerzo: 0, refaccion: 0, cena: 0 };
    const periodSales: Record<MealPeriod, number> = { almuerzo: 0, refaccion: 0, cena: 0 };

    valid.forEach((o) => {
      const p = getMealPeriod(new Date(o.created_at));
      periodCount[p] += 1;
      periodSales[p] += o.total_amount;
      o.items?.forEach((it) => {
        dishMap.set(it.product_name ?? 'Plato', (dishMap.get(it.product_name ?? 'Plato') ?? 0) + it.quantity);
      });
    });

    const topDishes = Array.from(dishMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { totalSales, count, avg, topDishes, periodCount, periodSales };
  }, [orders]);

  const maxDish = stats.topDishes[0]?.[1] ?? 1;
  const maxPeriod = Math.max(1, ...Object.values(stats.periodCount));
  const periods: MealPeriod[] = ['almuerzo', 'refaccion', 'cena'];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">Métricas de hoy</h2>
        <button onClick={onRefresh} className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-brand-300 hover:text-cream cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard Icon={TrendingUp} label="Ventas del día" value={formatCOP(stats.totalSales)} />
        <StatCard Icon={ShoppingCart} label="Pedidos" value={String(stats.count)} />
        <StatCard Icon={CreditCard} label="Ticket promedio" value={formatCOP(stats.avg)} />
      </div>

      {/* Top dishes */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand-400" /> Platos más vendidos</h3>
        {stats.topDishes.length === 0 ? (
          <p className="text-xs text-brand-300/60">Aún no hay ventas registradas hoy.</p>
        ) : (
          <div className="space-y-3">
            {stats.topDishes.map(([name, qty], i) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-cream"><span className="text-brand-400 font-bold">{i + 1}.</span> {name}</span>
                  <span className="text-brand-300 font-bold">{qty} und</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-950 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(qty / maxDish) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Franjas horarias */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-400" /> Consumo por franja horaria</h3>
        <p className="text-[10px] text-brand-300/60 mb-4">Almuerzo 11–16h · Refacción 16–19h · Cena 19–24h</p>
        <div className="grid grid-cols-3 gap-4">
          {periods.map((p) => (
            <div key={p} className="text-center">
              <div className="h-28 flex items-end justify-center mb-2">
                <div
                  className="w-12 bg-gradient-to-t from-brand-700 to-brand-400 rounded-t-lg transition-all"
                  style={{ height: `${(stats.periodCount[p] / maxPeriod) * 100}%`, minHeight: stats.periodCount[p] > 0 ? '8px' : '2px' }}
                />
              </div>
              <p className="text-xs font-bold text-cream">{mealPeriodLabel(p)}</p>
              <p className="text-[11px] text-brand-300">{stats.periodCount[p]} pedidos</p>
              <p className="text-[10px] text-brand-300/60">{formatCOP(stats.periodSales[p])}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ Icon: typeof TrendingUp; label: string; value: string }> = ({ Icon, label, value }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
    <Icon className="w-5 h-5 text-brand-400 mb-2" />
    <p className="text-[10px] text-brand-300/70 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-black text-cream mt-0.5 leading-tight">{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// INVENTARIO
// ---------------------------------------------------------------------------
const InventoryTab: React.FC<{
  inventory: Ingredient[];
  openGroups: Set<string>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  onReload: () => void;
}> = ({ inventory, openGroups, setOpenGroups, onReload }) => {
  const toggle = (g: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const lowCount = inventory.filter((i) => i.stock / i.capacity < 0.3).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-bold">Materia prima</h2>
          <p className="text-xs text-brand-300/70">{lowCount} ingrediente(s) por debajo del 30% · se merma al enviar pedidos a cocina</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateShoppingListPdf(inventory)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-cream text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> Lista de mandado (PDF)
          </button>
          <button
            onClick={() => { resetInventory(); onReload(); }}
            className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-brand-300 hover:text-cream text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer"
            title="Reabastecer (demo)"
          >
            <RotateCcw className="w-4 h-4" /> Reabastecer
          </button>
        </div>
      </div>

      {GROUPS.map(({ key, label, emoji }) => {
        const items = inventory.filter((i) => i.group === key);
        if (items.length === 0) return null;
        const open = openGroups.has(key);
        const groupLow = items.filter((i) => i.stock / i.capacity < 0.3).length;
        return (
          <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-neutral-850/50">
              <span className="flex items-center gap-2.5 font-bold text-sm">
                <span className="text-lg">{emoji}</span> {label}
                <span className="text-[10px] text-brand-300/60 font-normal">({items.length})</span>
                {groupLow > 0 && <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">{groupLow} bajo</span>}
              </span>
              <ChevronDown className={`w-4 h-4 text-brand-300 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="px-4 pb-3 border-t border-neutral-800/60">
                {items.map((ing) => <SupplyBar key={ing.id} ingredient={ing} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MESAS
// ---------------------------------------------------------------------------
const TablesTab: React.FC = () => {
  const navigate = useNavigate();
  const { store } = useApp();
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!store) return;
      const [{ data: tables }, { data: sessions }] = await Promise.all([
        sgpApi.getTables(),
        sgpApi.getActiveStoreSessions(store.id),
      ]);
      setTotal(tables?.length ?? 0);
      setActive((sessions ?? []).filter((s) => s.status === 'active').length);
    };
    load();
    const unsub = sgpApi.subscribeToBroadcast(() => load());
    return () => unsub();
  }, [store]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="font-display text-xl font-bold">Mesas</h2>
      <div className="grid grid-cols-3 gap-3">
        <StatCard Icon={LayoutGrid} label="Mesas totales" value={String(total)} />
        <StatCard Icon={ShoppingCart} label="Ocupadas" value={String(active)} />
        <StatCard Icon={Check} label="Libres" value={String(Math.max(0, total - active))} />
      </div>
      <p className="text-sm text-brand-300/80">Gestiona pedidos, entregas y cobros en el panel operativo del mesero.</p>
      <button onClick={() => navigate('/waiter')} className="bg-brand-600 hover:bg-brand-500 text-cream text-sm font-bold px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer">
        Abrir panel de mesero →
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// QR
// ---------------------------------------------------------------------------
const QrTab: React.FC<{ slug: string }> = ({ slug }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await sgpApi.getTables();
      const list = data ?? [];
      setTables(list);
      const entries = await Promise.all(
        list.map(async (t) => [t.id, await generateTableQrDataUrl(slug, t.id)] as const)
      );
      setQrs(Object.fromEntries(entries));
    };
    load();
  }, [slug]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="font-display text-xl font-bold">Códigos QR de mesas</h2>
      <p className="text-xs text-brand-300/70">Imprime y coloca cada QR en su mesa. Al escanearlo, el cliente entra directo al menú de compra.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col items-center">
            {qrs[t.id] ? (
              <img src={qrs[t.id]} alt={`QR ${t.name}`} className="w-full rounded-xl bg-cream" />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-neutral-850 animate-pulse" />
            )}
            <p className="text-xs font-bold mt-2">{t.name}</p>
            <p className="text-[10px] text-brand-300/60 mb-2 break-all text-center">{tableQrTargetUrl(slug, t.id)}</p>
            {qrs[t.id] && (
              <a href={qrs[t.id]} download={`Ventum_QR_${t.name.replace(' ', '_')}.png`} className="flex items-center gap-1 text-[11px] bg-brand-600 hover:bg-brand-500 text-cream font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Descargar
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUSCRIPCIÓN
// ---------------------------------------------------------------------------
const SubscriptionTab: React.FC = () => {
  const plans = [
    { name: 'Básico', price: 79000, features: ['Menú QR ilimitado', 'Pedidos a cocina en tiempo real', 'Hasta 10 mesas', 'Soporte por correo'] },
    { name: 'Pro', price: 149000, popular: true, features: ['Todo lo de Básico', 'Mesas ilimitadas', 'Sheila IA (mesera digital)', 'Inventario + lista de mandado', 'Métricas avanzadas'] },
    { name: 'Premium', price: 249000, features: ['Todo lo de Pro', 'Multi-sucursal', 'Pasarela de pago integrada', 'Pronóstico de demanda con IA', 'Gerente de cuenta dedicado'] },
  ];
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-xl font-bold mb-1">Planes de suscripción</h2>
      <p className="text-xs text-brand-300/70 mb-5">Modelo SaaS mensual por restaurante. Cancela cuando quieras.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl p-5 border ${p.popular ? 'bg-gradient-to-b from-brand-700 to-brand-900 border-brand-400' : 'bg-neutral-900 border-neutral-800'}`}>
            {p.popular && <span className="text-[10px] bg-accent-500 text-brand-950 font-black px-2 py-0.5 rounded-full">MÁS POPULAR</span>}
            <h3 className="font-display text-lg font-bold mt-2">{p.name}</h3>
            <p className="text-2xl font-black mt-1">{formatCOP(p.price)}<span className="text-xs font-normal text-brand-300">/mes</span></p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-cream/90">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
