import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Clock, Lock, Megaphone, Plus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAdStore, KioskAd } from '../store/useAdStore';
import { AdModal } from '../components/AdModal';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Modular Sub-components
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminAds } from '../components/admin/AdminAds';
import { AdminLogs } from '../components/admin/AdminLogs';
import { AdminSecurity } from '../components/admin/AdminSecurity';
import { AdminSettings } from '../components/admin/AdminSettings';

import { useAdminStats } from '../hooks/useAdminStats';

const AdminPanel: React.FC = () => {
  const { profile, isLoading: isAuthLoading } = useAuthStore();
  const { ads, fetchAds, createAd, updateAd, deleteAd, isLoading: isLoadingAds } = useAdStore();
  const { stats, isLoading: isLoadingStats, refetch: refetchStats } = useAdminStats();
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'security' | 'ads' | 'settings'>('overview');
  const [showAdModal, setShowAdModal] = useState(false);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleCreateAd = async (adData: Partial<KioskAd>) => {
    await createAd(adData);
    setShowAdModal(false);
  };

  if (isAuthLoading) return null;
  
  if (!profile?.is_super_admin) {
    return <Navigate to="/" replace />;
  }

  const logs = [
    { id: 1, action: 'Sincronización Realtime', user: 'Global', time: 'En vivo', status: 'success' },
    { id: 2, action: 'Acceso Administrativo', user: profile.full_name || profile.email, time: 'Ahora', status: 'info' },
    { id: 3, action: 'Monitoreo de Storage', user: 'Sistema', time: 'Activo', status: 'info' },
  ];

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Super Administrador</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Control Global</h1>
            <p className="text-sm text-slate-500">Gestión avanzada del ecosistema Kiosko Fotos</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {[
              { id: 'overview', label: 'General', icon: null },
              { id: 'ads', label: 'Publicidad', icon: Megaphone },
              { id: 'settings', label: 'Configuración', icon: null },
              { id: 'logs', label: 'Logs', icon: Clock },
              { id: 'security', label: 'Seguridad', icon: Lock }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <AdminOverview 
                stats={stats} 
                isLoading={isLoadingStats} 
                logs={logs} 
                onRefresh={refetchStats}
              />
            )}
            
            {activeTab === 'ads' && (
              <AdminAds 
                ads={ads} 
                isLoading={isLoadingAds} 
                onNewAd={() => setShowAdModal(true)}
                onUpdateAd={updateAd}
                onDeleteAd={deleteAd}
              />
            )}

            {activeTab === 'logs' && <AdminLogs />}
            
            {activeTab === 'security' && <AdminSecurity />}

            {activeTab === 'settings' && <AdminSettings />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showAdModal && (
          <AdModal 
            onClose={() => setShowAdModal(false)} 
            onSave={handleCreateAd} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
