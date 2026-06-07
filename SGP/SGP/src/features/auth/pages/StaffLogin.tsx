import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import type { UserRole } from '../../../types';
import { ShieldCheck, User, ChefHat, Bell, Key, AlertCircle } from 'lucide-react';
import notificationService from '../../../services/notifications';

const routeFor = (role: UserRole) => (role === 'cook' ? '/kitchen' : role === 'admin' ? '/admin' : '/waiter');

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginStaff, staffRole } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('waiter');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (staffRole) navigate(routeFor(staffRole)); }, [staffRole, navigate]);

  const press = (n: string) => { if (pinCode.length < 4) { setPinCode((p) => p + n); setErrorMsg(null); } };

  const submit = async () => {
    if (pinCode.length < 4) return;
    setLoading(true);
    setErrorMsg(null);
    const ok = await loginStaff(pinCode, selectedRole);
    setLoading(false);
    if (ok) { notificationService.playChime('success'); navigate(routeFor(selectedRole)); }
    else { setPinCode(''); setErrorMsg('PIN inválido. Usa 2580 para la demo.'); }
  };

  const roles: { key: UserRole; Icon: typeof Bell; label: string }[] = [
    { key: 'waiter', Icon: Bell, label: 'Mesero' },
    { key: 'cook', Icon: ChefHat, label: 'Cocina' },
    { key: 'admin', Icon: User, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-950 to-brand-900 text-cream flex flex-col justify-between p-6">
      <div className="flex flex-col items-center mt-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-cream/10 border border-cream/20 flex items-center justify-center text-brand-300 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-cream">Ventum · Personal</h1>
        <p className="text-[11px] text-brand-300 mt-0.5">Control de mandos operativos</p>
      </div>

      <div className="my-auto w-full max-w-sm mx-auto bg-brand-900/60 border border-brand-700/50 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map(({ key, Icon, label }) => (
            <button key={key} type="button" onClick={() => setSelectedRole(key)}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${selectedRole === key ? 'bg-brand-500 text-cream border-brand-400 font-bold' : 'bg-brand-800/60 border-brand-700/60 hover:bg-brand-700/60 text-brand-200'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-5">
          <div className="flex gap-4 justify-center items-center py-2.5 px-6 rounded-2xl bg-brand-950/60 border border-brand-700/50 w-full mb-3">
            <Key className="w-4 h-4 text-brand-400" />
            <div className="flex gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={`w-3.5 h-3.5 rounded-full border transition-all ${pinCode.length > i ? 'bg-brand-400 border-brand-400 scale-110' : 'border-brand-700 bg-brand-950'}`} />
              ))}
            </div>
          </div>
          {errorMsg && (
            <div className="flex items-center gap-1 text-[10px] text-red-300 bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-xl w-full">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((v) => (
            <button key={v} type="button" onClick={() => press(v)} className="w-[52px] h-[52px] rounded-full bg-brand-800/70 hover:bg-brand-700 active:bg-brand-600 flex items-center justify-center text-sm font-bold text-cream border border-brand-700/40 cursor-pointer">{v}</button>
          ))}
          <button type="button" onClick={() => setPinCode('')} className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[10px] font-semibold text-brand-300">Limpiar</button>
          <button type="button" onClick={() => press('0')} className="w-[52px] h-[52px] rounded-full bg-brand-800/70 hover:bg-brand-700 flex items-center justify-center text-sm font-bold text-cream border border-brand-700/40">0</button>
          <button type="button" onClick={() => setPinCode((p) => p.slice(0, -1))} className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[10px] font-bold text-red-300">Borrar</button>
        </div>

        <button onClick={submit} disabled={pinCode.length < 4 || loading}
          className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-98 ${pinCode.length === 4 && !loading ? 'bg-brand-500 hover:bg-brand-400 text-cream' : 'bg-brand-800/60 text-brand-400 cursor-not-allowed'}`}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <p className="text-center text-[10px] text-brand-400/70 mt-3">PIN demo: <strong className="text-brand-200">2580</strong></p>
      </div>

      <div className="text-center pb-2">
        <button onClick={() => navigate('/')} className="text-xs text-brand-300 hover:text-cream border border-brand-700/60 px-3.5 py-2 rounded-xl transition-all bg-brand-900/40 cursor-pointer">Ir a vista de clientes</button>
        <p className="text-[10px] text-brand-500 mt-3">&copy; 2026 Ventum · Cocina &amp; IA</p>
      </div>
    </div>
  );
};

export default StaffLogin;
