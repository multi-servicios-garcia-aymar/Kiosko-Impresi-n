import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Settings, HelpCircle, User, Printer, Calendar, Mail, MessageCircle, ExternalLink, KeyRound, LogOut, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivationScreen } from '../ActivationScreen';
import { DeviceSyncModal } from '../DeviceSyncModal';
import { useLicense } from '../../context/LicenseContext';
import { LicenseService } from '../../services/licenseService';
import { useAuthStore } from '../../store/useAuthStore';
import { Logo } from '../ui/Logo';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { license, trialStatus, refreshLicense } = useLicense();
  const { user, signOut } = useAuthStore();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [machineId, setMachineId] = useState<string>('');
  const [showActivation, setShowActivation] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    LicenseService.getMachineId().then(setMachineId).catch(() => setMachineId('Error'));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    };

    if (isAdminOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminOpen]);
  
  return (
    <div className="h-screen overflow-hidden print:overflow-visible print:h-auto print:block flex flex-col bg-slate-50 print:bg-white">
      {/* Activation Modal Overlay */}
      <AnimatePresence>
        {showActivation && (
          <ActivationScreen 
            onActivated={() => {
              refreshLicense();
              setShowActivation(false);
            }} 
            onClose={() => setShowActivation(false)} 
          />
        )}
        {showSyncModal && (
          <DeviceSyncModal onClose={() => setShowSyncModal(false)} />
        )}
      </AnimatePresence>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Logo size="md" className="bg-white rounded-xl shadow-md border border-slate-100 p-1" />
            <div className="flex flex-col justify-center hidden sm:flex">
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-tight">
                Kiosko de Impresión
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                Desarrollado por Nexo Network Ec
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={adminRef}>
              <button 
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden shadow-sm shadow-indigo-200">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-bold text-slate-700 leading-tight">Admin</span>
                  <span className="text-[10px] font-medium text-slate-400 leading-tight truncate max-w-[100px]">
                    {license ? license.clientName : (trialStatus?.isTrialActive ? 'Modo Prueba' : 'Sin Licencia')}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isAdminOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 transform origin-top-right"
                  >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Actual</span>
                            <span className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">
                              {user?.email || 'Usuario de Autenticación'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button 
                            onClick={async () => {
                              await signOut();
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                          >
                            <LogOut className="w-5 h-5" />
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-bold">Cerrar Sesión</span>
                              <span className="text-[10px] opacity-70">Desconectar perfil de la nube</span>
                            </div>
                          </button>

                          {license && (
                            <button 
                              onClick={() => {
                                setIsAdminOpen(false);
                                setShowSyncModal(true);
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              <Smartphone className="w-5 h-5" />
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">Vincular otro dispositivo</span>
                                <span className="text-[10px] opacity-70">Sincroniza sin claves</span>
                              </div>
                            </button>
                          )}

                          {!license && (
                            <button 
                              onClick={() => {
                                setIsAdminOpen(false);
                                setShowActivation(true);
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              <KeyRound className="w-5 h-5" />
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">Activar Licencia</span>
                                <span className="text-[10px] opacity-70">Ingresar clave de producto</span>
                              </div>
                            </button>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Estado de Licencia</span>
                            <span className={`font-bold ${
                              license 
                                ? (new Date(license.expiresAt) < new Date() ? 'text-red-500' : 'text-green-500')
                                : (trialStatus?.isTrialActive ? 'text-amber-500' : 'text-red-500')
                            }`}>
                              {license 
                                ? (new Date(license.expiresAt) < new Date() ? 'Expirada' : 'Activa')
                                : (trialStatus?.isTrialActive ? 'Prueba Activa' : 'Inactiva')}
                            </span>
                          </div>
                          
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {license ? 'Fecha de Expiración' : 'Fin de Prueba'}
                              </span>
                            </div>
                            <span className={`text-sm font-mono font-bold ${
                              license && (new Date(license.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7
                                ? 'text-amber-600'
                                : (trialStatus?.isTrialActive ? 'text-amber-600' : 'text-slate-700')
                            }`}>
                              {license ? new Date(license.expiresAt).toLocaleDateString('es-EC', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) : (trialStatus?.isTrialActive ? `En ${trialStatus.daysRemaining} días` : 'Expirada')}
                            </span>
                          </div>
                        </div>

                        {/* Support Section */}
                        <div className="pt-4 mt-1 border-t border-slate-100 space-y-3">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas y Soporte Técnico</span>
                            <div className="flex flex-col gap-2">
                              <a 
                                href="mailto:nexonetwork.ec@gmail.com" 
                                className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors group"
                              >
                                <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                  <Mail className="w-3.5 h-3.5" />
                                </div>
                                nexonetwork.ec@gmail.com
                              </a>
                              <a 
                                href="https://wa.me/593998166596" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-slate-600 hover:text-green-600 transition-colors group"
                              >
                                <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </div>
                                0998166596
                              </a>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID de Equipo</span>
                              <ExternalLink className="w-3 h-3 text-slate-300" />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 break-all select-all">
                              {machineId || 'Obteniendo...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible print:flex-none print:h-auto">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 print:hidden">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-indigo-600">
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Inicio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Ajustes</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <HelpCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Ayuda</span>
        </button>
      </div>
    </div>
  );
}
