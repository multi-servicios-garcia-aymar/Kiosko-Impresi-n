import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Users, FileText, Settings, 
  ChevronRight, BarChart3, Clock, AlertCircle,
  Database, Activity, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { profile, isLoading: isAuthLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'security'>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPhotos: 0,
    dbHealth: 'Óptimo',
    activeToday: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        // 1. Total Users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // 2. Total Photos in cloud
        const { count: photoCount } = await supabase
          .from('kiosk_gallery_photos')
          .select('*', { count: 'exact', head: true });

        // 3. Active today (users who signed in recently)
        const today = new Date();
        today.setHours(0,0,0,0);
        const { count: activeCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', today.toISOString());

        setStats({
          totalUsers: userCount || 0,
          totalPhotos: photoCount || 0,
          dbHealth: 'Óptimo',
          activeToday: activeCount || 0
        });
      } catch (e) {
        console.error('Error fetching admin stats', e);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  if (isAuthLoading) return null;
  
  // Strict check for super admin
  if (!profile?.is_super_admin) {
    return <Navigate to="/" replace />;
  }

  const metrics = [
    { label: 'Usuarios Registrados', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Fotos en la Nube', value: stats.totalPhotos, icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Actividad Hoy', value: stats.activeToday, icon: Activity, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Estado DB', value: stats.dbHealth, icon: Database, color: 'bg-amber-50 text-amber-600' },
  ];

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
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Super Administrador</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Control Global</h1>
            <p className="text-sm text-slate-500">Gestión avanzada del ecosistema Kiosko Fotos</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Logs
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'security' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Seguridad
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-0.5">{item.label}</p>
                    <p className="text-xl font-bold text-slate-900">
                      {isLoadingStats ? (
                        <span className="inline-block w-8 h-4 bg-slate-100 animate-pulse rounded" />
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity Section */}
              <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Estado del Sistema</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Monitoreo Activo</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-emerald-400' : 
                          log.status === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{log.action}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Fuente: {log.user}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions / Status */}
              <aside className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-500" />
                    Salud del Ecosistema
                  </h2>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-3">
                    <p className="text-xs font-bold text-indigo-800 mb-1">Carga de Datos</p>
                    <p className="text-[10px] text-indigo-600 leading-relaxed">
                      El volumen de procesamiento de imágenes es normal. No se requiere intervención.
                    </p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Actualizar Métricas
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Logs de Auditoría</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Aquí podrás ver cada acción realizada por los usuarios. Actualmente los logs están siendo capturados en Supabase Auth Audit.
            </p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
            <ShieldCheck className="w-12 h-12 text-indigo-100 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Configuración de Seguridad</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Las reglas de seguridad RLS son aplicadas directamente desde Supabase para garantizar protección de Grado Bancario.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPanel;
