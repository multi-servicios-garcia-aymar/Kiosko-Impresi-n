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
  const { profile, isLoading } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    dbHealth: 'Normal'
  });

  useEffect(() => {
    // In a real app, we would fetch actual stats here
    // For now, we simulate basic metrics
    setStats({
      totalUsers: 142,
      activeSessions: 12,
      dbHealth: 'Óptimo'
    });
  }, []);

  if (isLoading) return null;
  
  // Strict check for super admin
  if (!profile?.is_super_admin) {
    return <Navigate to="/" replace />;
  }

  const metrics = [
    { label: 'Usuarios Registrados', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Sesiones Activas', value: stats.activeSessions, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Estado del Servidor', value: stats.dbHealth, icon: Database, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Licencias Activas', value: '84%', icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
  ];

  const logs = [
    { id: 1, action: 'Actualización de Plantilla', user: 'Admin 1', time: 'hace 2 min', status: 'success' },
    { id: 2, action: 'Nuevo Registro de Usuario', user: 'Sistema', time: 'hace 15 min', status: 'info' },
    { id: 3, action: 'Error de Sincronización', user: 'Node_Worker_01', time: 'hace 1 hora', status: 'error' },
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
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Logs de Actividad
            </button>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Seguridad
            </button>
          </div>
        </header>

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
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Section */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Actividad del Sistema</h2>
              <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="w-3 h-3" />
              </button>
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
                      <p className="text-[10px] text-slate-400 font-medium">Realizado por: {log.user}</p>
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
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Alertas Críticas
              </h2>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-3">
                <p className="text-xs font-bold text-amber-800 mb-1">Mantenimiento Pendiente</p>
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  Se recomienda depuración de caché de Supabase antes del fin de semana.
                </p>
              </div>
              <button className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                Ignorar Aviso
              </button>
            </div>

            <div className="bg-indigo-600 p-5 rounded-2xl shadow-indigo-200 shadow-lg text-white">
              <h2 className="text-sm font-bold mb-2">Respaldo Automático</h2>
              <p className="text-[10px] text-white/80 mb-4 leading-relaxed">
                Tus datos de Supabase se respaldan cada 24 horas. Próximo respaldo programado: 03:00 AM.
              </p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                Respaldar Ahora
              </button>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
