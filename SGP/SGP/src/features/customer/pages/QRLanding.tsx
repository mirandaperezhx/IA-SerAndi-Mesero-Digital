import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import sgpApi from '../../../lib/supabase';
import type { Table } from '../../../types';
import { QrCode, Lock, AlertCircle } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const QRLanding: React.FC = () => {
  const { tableId } = useParams<{ storeSlug?: string; tableId?: string }>();
  const navigate = useNavigate();
  const { store, enterTable, activeSession } = useApp();

  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await sgpApi.getTables();
      if (data) {
        setTablesList(data);
        if (tableId) {
          const matched = data.find((t) => t.id === tableId || t.name.toLowerCase().replace(' ', '-') === tableId);
          if (matched) setSelectedTable(matched);
        }
      }
    };
    fetchTables();
  }, [tableId]);

  useEffect(() => { notificationService.requestPermission(); }, []);

  useEffect(() => {
    if (activeSession && selectedTable && activeSession.table_id === selectedTable.id && activeSession.status === 'active') {
      navigate('/menu');
    }
  }, [activeSession, selectedTable, navigate]);

  const handleKey = (num: string) => { if (passcode.length < 4) { setPasscode((p) => p + num); setAuthError(null); } };
  const handleBackspace = () => setPasscode((p) => p.slice(0, -1));

  const handleSubmit = async () => {
    if (!selectedTable || passcode.length < 4) return;
    setIsValidating(true);
    setAuthError(null);
    const ok = await enterTable(selectedTable.id, passcode);
    setIsValidating(false);
    if (ok) { notificationService.playChime('success'); navigate('/menu'); }
    else { setPasscode(''); setAuthError('Clave incorrecta. Ej: Mesa 1 = 1001, Mesa 15 = 1015.'); }
  };

  return (
    <div className="min-h-screen bg-brand-950 text-cream flex flex-col justify-between px-6 py-8 bg-gradient-to-b from-brand-950 to-brand-900">
      <div className="flex flex-col items-center mt-6 text-center">
        <img src="/logo.svg" alt="Ventum" className="h-14 mb-3 drop-shadow-lg" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        <h1 className="font-display text-3xl font-bold text-cream">{store?.name ?? 'Ventum'}</h1>
        <p className="text-xs text-brand-300 mt-1 tracking-wide">Mesero digital con inteligencia artificial</p>
      </div>

      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {!selectedTable ? (
          <div className="bg-brand-900/60 border border-brand-700/50 rounded-3xl p-6 backdrop-blur-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <QrCode className="w-5 h-5 text-brand-300" />
              <h2 className="text-md font-semibold text-cream">Simulador de escaneo QR</h2>
            </div>
            <p className="text-xs text-brand-300 text-center mb-6">Selecciona una mesa para simular el escaneo del código QR físico.</p>
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {tablesList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTable(t); setPasscode(''); setAuthError(null); navigate(`/s/${store?.slug ?? 'ventum'}/t/${t.id}`); }}
                  className="py-3 px-2 rounded-xl text-center bg-brand-800/60 hover:bg-brand-600 border border-brand-700/50 hover:border-brand-400 text-xs font-medium transition-all cursor-pointer"
                >
                  {t.name}
                  <span className="block text-[9px] text-brand-300/70 mt-0.5">PIN: {t.passcode}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-brand-900/60 border border-brand-700/50 rounded-3xl p-6 backdrop-blur-xl animate-fade-in flex flex-col items-center">
            <h2 className="text-lg font-bold text-cream flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-400 inline-block animate-ping" />
              Ingresando a la {selectedTable.name}
            </h2>
            <p className="text-xs text-brand-300 text-center mt-1 mb-6">Digita la clave de 4 dígitos de tu tarjeta QR.</p>

            <div className="flex gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border transition-all ${passcode.length > i ? 'bg-brand-400 border-brand-400 scale-110' : 'border-brand-700 bg-brand-950'}`} />
              ))}
            </div>

            {authError && (
              <div className="flex items-center gap-1.5 text-xs text-red-300 bg-red-500/15 border border-red-500/25 px-3 py-2 rounded-xl mb-4 text-center">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{authError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 w-full max-w-[260px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button key={n} type="button" onClick={() => handleKey(n)} disabled={isValidating}
                  className="w-14 h-14 rounded-full bg-brand-800 hover:bg-brand-700 active:bg-brand-600 flex items-center justify-center text-lg font-bold text-cream border border-brand-700/40 transition-all cursor-pointer">
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => { setSelectedTable(null); setPasscode(''); }} className="w-14 h-14 rounded-full bg-brand-950 text-brand-300 hover:text-cream flex items-center justify-center text-xs font-semibold">Volver</button>
              <button type="button" onClick={() => handleKey('0')} className="w-14 h-14 rounded-full bg-brand-800 hover:bg-brand-700 flex items-center justify-center text-lg font-bold text-cream border border-brand-700/40">0</button>
              <button type="button" onClick={handleBackspace} className="w-14 h-14 rounded-full bg-brand-950 text-red-300 flex items-center justify-center text-xs font-bold">Borrar</button>
            </div>

            <button onClick={handleSubmit} disabled={passcode.length < 4 || isValidating}
              className={`w-full max-w-[260px] py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 ${passcode.length === 4 && !isValidating ? 'bg-brand-500 hover:bg-brand-400 text-cream' : 'bg-brand-800 text-brand-400 cursor-not-allowed'}`}>
              {isValidating ? (<><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" /> Validando...</>) : (<><Lock className="w-4 h-4" /> Acceder al menú</>)}
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-brand-400/70 pb-2">
        <button onClick={() => navigate('/login')} className="underline hover:text-brand-200 mb-2">Acceso de personal</button>
        <p>&copy; 2026 Ventum · Cocina &amp; IA</p>
      </div>
    </div>
  );
};

export default QRLanding;
