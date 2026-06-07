import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import sgpApi from '../../../lib/supabase';
import type { Table } from '../../../types';
import { QrCode, Lock, AlertCircle, Sparkles } from 'lucide-react';
import notificationService from '../../../services/notifications';

export const QRLanding: React.FC = () => {
  const { tableId } = useParams<{ storeSlug?: string; tableId?: string }>();
  const navigate = useNavigate();
  const { enterTable, activeSession } = useApp();

  const [tablesList, setTablesList] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load all tables if in simulator mode
  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await sgpApi.getTables();
      if (data) {
        setTablesList(data);
        if (tableId) {
          const matched = data.find(t => t.id === tableId || t.name.toLowerCase().replace(' ', '-') === tableId);
          if (matched) setSelectedTable(matched);
        }
      }
    };
    fetchTables();
  }, [tableId]);

  // Request notifications consent immediately for customer order updates
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  // Redirect to menu if session is already active for this table
  useEffect(() => {
    if (activeSession && selectedTable && activeSession.table_id === selectedTable.id && activeSession.status === 'active') {
      navigate('/menu');
    }
  }, [activeSession, selectedTable, navigate]);

  const handleKeyPress = (num: string) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + num);
      setAuthError(null);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTable || passcode.length < 4) return;

    setIsValidating(true);
    setAuthError(null);

    const success = await enterTable(selectedTable.id, passcode);
    setIsValidating(false);

    if (success) {
      notificationService.playChime('success');
      navigate('/menu');
    } else {
      setPasscode('');
      setAuthError('Clave incorrecta. Ej: Mesa 1 es 1001, Mesa 15 es 1015.');
    }
  };

  // Helper to handle manual table selection in simulator
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setPasscode('');
    setAuthError(null);
    navigate(`/s/el-rincon-sabor/t/${table.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col items-center mt-6 text-center">
        <div className="w-14 h-14 bg-brand-500/10 rounded-full flex items-center justify-center border border-brand-500/20 mb-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-500 to-emerald-300 bg-clip-text text-transparent">
          El Rincón del Sabor
        </h1>
        <p className="text-xs text-slate-400 mt-1">Sistemas de Gestión de Pedidos SGP</p>
      </div>

      {/* Main Panel */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {!selectedTable ? (
          /* Simulator Table Selection Grid */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl animate-fade-in">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <QrCode className="w-5 h-5 text-brand-500" />
              <h2 className="text-md font-semibold text-slate-200">Simulador de Escaneo QR</h2>
            </div>
            <p className="text-xs text-slate-400 text-center mb-6">
              Selecciona una de las 15 mesas para simular el escaneo del código QR físico.
            </p>
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {tablesList.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTable(t)}
                  className="py-3 px-2 rounded-xl text-center bg-slate-800/80 hover:bg-brand-600 hover:text-white border border-slate-700/50 hover:border-brand-500 text-xs font-medium transition-all"
                >
                  {t.name}
                  <span className="block text-[9px] text-slate-500 hover:text-brand-100 mt-0.5">
                    PIN: {t.passcode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Passcode Pinpad Interface */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl animate-fade-in flex flex-col items-center">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block animate-ping"></span>
              Ingresando a la {selectedTable.name}
            </h2>
            <p className="text-xs text-slate-400 text-center mt-1 mb-6">
              Digita la clave de acceso de 4 dígitos que aparece en tu tarjeta QR.
            </p>

            {/* Passcode dots display */}
            <div className="flex gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                    passcode.length > i
                      ? 'bg-brand-500 border-brand-500 scale-110 shadow-lg shadow-brand-500/30'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {authError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl mb-4 text-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Custom Interactive Virtual Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-[260px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isValidating}
                  className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-brand-600 active:text-white flex items-center justify-center text-lg font-bold text-slate-200 border border-slate-700/40 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedTable(null);
                  setPasscode('');
                }}
                className="w-14 h-14 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-semibold"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200 border border-slate-700/40"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-14 h-14 rounded-full bg-slate-900 text-rose-400 active:bg-rose-500/10 flex items-center justify-center text-xs font-bold"
              >
                Borrar
              </button>
            </div>

            {/* Validation Trigger Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={passcode.length < 4 || isValidating}
              className={`w-full max-w-[260px] py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg ${
                passcode.length === 4 && !isValidating
                  ? 'bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-brand-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/30 cursor-not-allowed'
              }`}
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Validando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Acceder al Menú
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-slate-500 pb-2">
        <p>&copy; 2026 SGP SaaS. Todos los derechos reservados.</p>
        <p className="mt-0.5 text-slate-600">Optimizando operaciones gastronómicas en tiempo real.</p>
      </div>
    </div>
  );
};

export default QRLanding;
