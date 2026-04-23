import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldCheck, AlertCircle, Loader2, Printer, Mail, MessageCircle } from 'lucide-react';
import { LicenseService } from '../services/LicenseService';
import { Logo } from './ui/Logo';

interface ActivationScreenProps {
  onActivated: () => void;
  onClose?: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated, onClose }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string>('Cargando...');

  useEffect(() => {
    LicenseService.getMachineId()
      .then(id => setMachineId(id))
      .catch(err => setMachineId('Error al obtener ID'));
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError('Por favor, ingresa una clave de licencia.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await LicenseService.activateLicense(licenseKey.trim());
      if (result.success) {
        onActivated();
        if (onClose) onClose();
      } else {
        setError(result.error || 'Error desconocido al activar.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto ${onClose ? 'fixed inset-0 z-[100]' : ''}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2rem)] my-auto"
      >
        {onClose && (
          <div className="px-6 pt-6 flex justify-end shrink-0">
            <button 
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-100 rounded-xl text-slate-500 text-[10px] font-bold uppercase tracking-wider transition-colors border border-slate-100 shadow-sm"
            >
              Regresar al modo de Prueba
            </button>
          </div>
        )}
        <div className={`overflow-y-auto custom-scrollbar ${onClose ? "p-8 pt-4" : "p-8"}`}>
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Activación de Software
          </h2>
          <p className="text-center text-slate-500 mb-8 text-sm">
            Ingresa tu clave de producto para desbloquear el Kiosko de Impresión. 
            <span className="block mt-1 text-indigo-500 font-medium">
              La licencia se vinculará automáticamente a este equipo al activarse.
            </span>
          </p>

          <form onSubmit={handleActivate} className="space-y-6">
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-slate-700 mb-2">
                Clave de Licencia
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="license"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all uppercase tracking-widest font-mono text-sm placeholder:normal-case placeholder:tracking-normal"
                  placeholder="NEXO-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !licenseKey.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validando...
                </>
              ) : (
                'Activar Producto'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Ventas y Soporte Técnico</span>
              <div className="flex flex-col items-center gap-1.5">
                <a href="mailto:nexonetwork.ec@gmail.com" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  nexonetwork.ec@gmail.com
                </a>
                <a href="https://wa.me/593998166596" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-green-600 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  0998166596
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
              <span>ID de Equipo:</span>
              <span className="font-mono bg-slate-100 px-2 py-1 rounded select-all">
                {machineId}
              </span>
            </div>
            <p className="text-[10px] text-center mt-2 text-slate-400">
              Desarrollado por Nexo Network Ec
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
