import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import type { UserRole } from '../../../types';
import { ShieldCheck, User, ChefHat, Bell, Key, AlertCircle } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginStaff, staffRole } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('waiter');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (staffRole) {
      if (staffRole === 'cook') navigate('/kitchen');
      else navigate('/waiter');
    }
  }, [staffRole, navigate]);

  const handleNumPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode(prev => prev + num);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinCode('');
  };

  const handleLoginSubmit = async () => {
    if (pinCode.length < 4) return;
    setLoading(true);
    setErrorMsg(null);

    const success = await loginStaff(pinCode, selectedRole);
    setLoading(false);

    if (success) {
      notificationService.playChime('success');
      if (selectedRole === 'cook') navigate('/kitchen');
      else navigate('/waiter');
    } else {
      setPinCode('');
      setErrorMsg('PIN inválido. Intenta con "2580" o "1234" para la demo.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-100 flex flex-col justify-between p-6">
      
      {/* Top Header Logo */}
      <div className="flex flex-col items-center mt-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mb-3">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand-500 to-emerald-400 bg-clip-text text-transparent">
          SGP Acceso de Personal
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Control de mandos operativos</p>
      </div>

      {/* Login Frame */}
      <div className="my-auto w-full max-w-sm mx-auto bg-neutral-850 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        
        {/* Role Selector Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Waiter (Mesero) */}
          <button
            type="button"
            onClick={() => setSelectedRole('waiter')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              selectedRole === 'waiter'
                ? 'bg-brand-500 text-slate-950 border-brand-500 font-bold'
                : 'bg-neutral-800 border-neutral-700/60 hover:bg-neutral-700/60 text-slate-350'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="text-[10px]">Mesero</span>
          </button>

          {/* Cook (Cocina) */}
          <button
            type="button"
            onClick={() => setSelectedRole('cook')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              selectedRole === 'cook'
                ? 'bg-brand-500 text-slate-950 border-brand-500 font-bold'
                : 'bg-neutral-800 border-neutral-700/60 hover:bg-neutral-700/60 text-slate-350'
            }`}
          >
            <ChefHat className="w-4.5 h-4.5" />
            <span className="text-[10px]">Cocina</span>
          </button>

          {/* Admin */}
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-brand-500 text-slate-950 border-brand-500 font-bold'
                : 'bg-neutral-800 border-neutral-700/60 hover:bg-neutral-700/60 text-slate-350'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            <span className="text-[10px]">Admin</span>
          </button>
        </div>

        {/* PIN Entry Display */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex gap-4 justify-center items-center py-2.5 px-6 rounded-2xl bg-neutral-900 border border-neutral-800 w-full mb-3 text-center">
            <Key className="w-4 h-4 text-slate-500" />
            <div className="flex gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-100 ${
                    pinCode.length > idx
                      ? 'bg-brand-500 border-brand-500 shadow-sm shadow-brand-500/25 scale-110'
                      : 'border-slate-700 bg-neutral-950'
                  }`}
                />
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1 text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-center w-full">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Virtual Pinpad Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleNumPress(val)}
              className="w-13 h-13 rounded-full bg-neutral-800 hover:bg-neutral-700 active:bg-brand-650 flex items-center justify-center text-sm font-bold text-slate-100 border border-neutral-700/40 cursor-pointer"
            >
              {val}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-13 h-13 rounded-full flex items-center justify-center text-[10px] font-semibold text-slate-400"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleNumPress('0')}
            className="w-13 h-13 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-sm font-bold border border-neutral-700/40"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-13 h-13 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-400 active:bg-rose-500/15"
          >
            Borrar
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleLoginSubmit}
          disabled={pinCode.length < 4 || loading}
          className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98 ${
            pinCode.length === 4 && !loading
              ? 'bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-brand-500/15'
              : 'bg-neutral-800 text-neutral-600 border border-neutral-700/30 cursor-not-allowed'
          }`}
        >
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </div>

      {/* Customer Quick Switcher */}
      <div className="text-center pb-2">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-500 hover:text-brand-500 border border-neutral-800 hover:border-brand-500/20 px-3.5 py-2 rounded-xl transition-all bg-neutral-900 cursor-pointer"
        >
          Ir a Vista de Clientes
        </button>
        <p className="text-[10px] text-slate-600 mt-3">&copy; SGP SaaS 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default StaffLogin;
