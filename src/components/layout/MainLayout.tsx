import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Printer, Calendar, Mail, MessageCircle, ExternalLink, KeyRound, LogOut, Smartphone, Shield, Scale, ShieldCheck, X, Image as ImageIcon, LayoutDashboard, ChevronRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivationScreen } from '../ActivationScreen';
import { DeviceSyncModal } from '../DeviceSyncModal';
import { useLicense } from '../../context/LicenseContext';
import { LicenseService } from '../../services/LicenseService';
import { useAuthStore } from '../../store/useAuthStore';
import { usePhotoStore } from '../../store/usePhotoStore';
import { Logo } from '../ui/Logo';
import { KioskAdSidebar } from '../KioskAdSidebar';
import { KioskAdOverlay } from '../KioskAdOverlay';

import { useAdTargeting } from '../../hooks/useAdTargeting';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { license, trialStatus, refreshLicense } = useLicense();
  const { user, profile, signOut } = useAuthStore();
  const { initializeCloudSync } = usePhotoStore();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [machineId, setMachineId] = useState<string>('');
  const [showActivation, setShowActivation] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const sidebarAds = useAdTargeting({ placement: 'sidebar' });

  useEffect(() => {
    LicenseService.getMachineId().then(setMachineId).catch(() => setMachineId('Error'));
  }, []);
  
  useEffect(() => {
    if (user) {
      initializeCloudSync();
    }
  }, [user, initializeCloudSync]);

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
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 px-4 py-3 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <Logo size="md" className="bg-white rounded-xl shadow-lg border border-slate-100 p-1 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col justify-center hidden sm:flex">
              <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x leading-tight uppercase">
                Foto Estudio App
              </span>
              <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">
                Premium Printing Suite
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/50 rounded-2xl p-1 border border-slate-200/50 backdrop-blur-sm">
            <button 
              onClick={() => navigate('/')}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                window.location.pathname === '/' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
              }`}
            >
              Inicio
            </button>
            <div className="w-px h-3 bg-slate-200" />
            <button 
              onClick={() => navigate('/legal')}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                window.location.pathname === '/legal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
              }`}
            >
              Ayuda
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={adminRef}>
              <button 
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="flex items-center gap-2 p-1.5 pr-4 bg-slate-900 text-white rounded-full transition-all hover:bg-slate-800 hover:shadow-xl group active:scale-95 z-50 relative"
              >
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg group-hover:rotate-12 transition-transform">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start hidden xs:flex">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Menú Principal</span>
                </div>
              </button>

              <AnimatePresence>
                {isAdminOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAdminOpen(false)}
                      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] cursor-default"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[101] shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
                    >
                      {/* Drawer Header */}
                      <div className="relative p-8 pb-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Logo size="md" className="bg-slate-50 rounded-2xl shadow-sm p-1.5" />
                          <div className="flex flex-col">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Foto Estudio</h2>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Panel de Control</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsAdminOpen(false)}
                          className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Drawer Body - Scrollable */}
                      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar space-y-10">
                        {/* Account Section */}
                        <section>
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información de Cuenta</h3>
                          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 group hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 text-white">
                                <User className="w-8 h-8" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Usuario Cloud</span>
                                <h4 className="text-lg font-black text-slate-900 truncate tracking-tight">{user?.email || 'N/A'}</h4>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-2xl p-3 border border-slate-100/50">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Licencia</span>
                                <div className={`flex items-center gap-1.5 text-xs font-black ${license ? 'text-green-600' : 'text-amber-600'}`}>
                                  {license ? 'ACTIVA' : 'PRUEBA'}
                                </div>
                              </div>
                              <div className="bg-white rounded-2xl p-3 border border-slate-100/50">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Rol</span>
                                <div className="text-xs font-black text-indigo-600 uppercase">
                                  {profile?.is_super_admin ? 'Super Admin' : 'Editor'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Navigation Section */}
                        <section>
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Acciones Principales</h3>
                          <div className="grid gap-3">
                            {[
                              { label: 'Ir al Inicio', sub: 'Formatos y Captura', icon: LayoutDashboard, path: '/', color: 'bg-blue-50 text-blue-600' },
                              { label: 'Gestión Cloud', sub: 'Control de Galería', icon: ImageIcon, path: '/galeria', color: 'bg-emerald-50 text-emerald-600', isComing: true },
                              { label: 'Administración', sub: 'Configuración Avanzada', icon: ShieldCheck, path: '/admin', color: 'bg-indigo-50 text-indigo-600', roles: ['admin'] },
                            ].filter(item => !item.roles || profile?.is_super_admin).map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (!item.isComing) {
                                    navigate(item.path);
                                    setIsAdminOpen(false);
                                  }
                                }}
                                className="group w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 relative overflow-hidden"
                              >
                                <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                  <item.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 text-left">
                                  <h5 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{item.label}</h5>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.sub}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                                {item.isComing && (
                                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900 text-white text-[7px] font-black rounded uppercase tracking-widest">Smart-Sync</div>
                                )}
                              </button>
                            ))}
                          </div>
                        </section>

                        {/* System Section */}
                        <section>
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Utilidades del Sistema</h3>
                          <div className="grid gap-2">
                             <button 
                                onClick={() => {
                                  setIsAdminOpen(false);
                                  setShowSyncModal(true);
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-2xl transition-all border border-indigo-100/50"
                              >
                                <Smartphone className="w-5 h-5" />
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-black uppercase tracking-tight">Sincronizar Dispositivo</span>
                                  <span className="text-[9px] font-bold opacity-70 uppercase">Escanea QR de Acceso</span>
                                </div>
                              </button>

                              {!license && (
                                <button 
                                  onClick={() => {
                                    setIsAdminOpen(false);
                                    setShowActivation(true);
                                  }}
                                  className="w-full flex items-center gap-3 p-4 bg-amber-50/50 hover:bg-amber-50 text-amber-700 rounded-2xl transition-all border border-amber-100/50"
                                >
                                  <KeyRound className="w-5 h-5" />
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-black uppercase tracking-tight">Activar Licencia</span>
                                    <span className="text-[9px] font-bold opacity-70 uppercase">Clave de producto</span>
                                  </div>
                                </button>
                              )}

                              <button 
                                onClick={async () => {
                                  await signOut();
                                  setIsAdminOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-rose-50/50 hover:bg-rose-50 text-rose-700 rounded-2xl transition-all border border-rose-100/50"
                              >
                                <LogOut className="w-5 h-5" />
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-black uppercase tracking-tight">Cerrar Sesión</span>
                                  <span className="text-[9px] font-bold opacity-70 uppercase">Desconectar nube</span>
                                </div>
                              </button>
                          </div>
                        </section>

                        {/* Support Info */}
                        <section className="pt-6 border-t border-slate-100">
                          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="relative z-10">
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Soporte Premium</h4>
                              <p className="text-sm font-medium text-slate-300 mb-6">¿Necesitas ayuda con tu estación de impresión?</p>
                              
                              <div className="space-y-4">
                                <a href="https://wa.me/593998166596" target="_blank" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                                  <MessageCircle className="w-5 h-5 text-green-400" />
                                  <span className="text-xs font-black uppercase tracking-widest">WhatsApp Directo</span>
                                </a>
                                <a href="mailto:nexonetwork.ec@gmail.com" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                                  <Mail className="w-5 h-5 text-blue-400" />
                                  <span className="text-xs font-black uppercase tracking-widest">Email Corporativo</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>

                      {/* Drawer Footer */}
                      <div className="p-8 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Hardware Unica</span>
                           <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">v1.2.4</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-mono font-bold text-slate-500 break-all select-all shadow-sm">
                           {machineId || 'IDENTIFYING_HARDWARE...'}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Optional Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible print:flex-none print:h-auto">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
        
        {/* Ad Sidebar - Only visible on XL and above if there are ads */}
        {sidebarAds.length > 0 && (
          <aside className="w-80 shrink-0 hidden xl:block border-l border-slate-100 h-full bg-white">
            <KioskAdSidebar />
          </aside>
        )}
      </div>

      <KioskAdOverlay />

      {/* Global Bottom Credits - Tiny & Elegant */}
      <footer className="bg-white border-t border-slate-100 py-3 px-4 print:hidden shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/50 opacity-70 hover:opacity-100 transition-all">
            <Shield className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Secure Cloud Ready
            </span>
          </div>
          
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/legal')}
              className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-all"
            >
              Legal
            </button>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-[10px] font-black text-slate-300 tracking-widest">
              © {new Date().getFullYear()} FOTO ESTUDIO APP
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
