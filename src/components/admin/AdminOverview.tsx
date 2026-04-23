import React from 'react';
import { 
  Users, BarChart3, Activity, Database, 
  ArrowUpRight, ArrowDownRight, RefreshCw, History 
} from 'lucide-react';
import { motion } from 'motion/react';

interface Stats {
  totalUsers: number;
  totalPhotos: number;
  dbHealth: string;
  activeToday: number;
}

interface AdminOverviewProps {
  stats: Stats;
  isLoading: boolean;
  logs: any[];
  onRefresh?: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ stats, isLoading, logs, onRefresh }) => {
  const cards = [
    { 
      label: 'Usuarios Totales', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Fotos en la Nube', 
      value: stats.totalPhotos, 
      icon: BarChart3, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      trend: '+5%',
      trendUp: true
    },
    { 
      label: 'Actividad Hoy', 
      value: stats.activeToday, 
      icon: Activity, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '-2%',
      trendUp: false
    },
    { 
      label: 'Estado DB', 
      value: stats.dbHealth, 
      icon: Database, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      trend: '100%',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tabular-nums">
                {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg" /> : card.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Logs */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Actividad Reciente</h4>
                <p className="text-xs text-slate-500">Últimos eventos del sistema</p>
              </div>
            </div>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Ver todo</button>
          </div>
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors pointer-events-none">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-emerald-500' : 
                    log.status === 'info' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{log.user}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Summary */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between text-left">
          <div className="relative z-10">
            <RefreshCw 
              className={`w-10 h-10 text-indigo-300/50 mb-6 cursor-pointer hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin text-white' : ''}`} 
              onClick={onRefresh}
            />
            <h4 className="text-2xl font-black mb-2 leading-tight">Estado de la Infraestructura</h4>
            <p className="text-indigo-100 text-sm opacity-80 leading-relaxed">
              Todos los microservicios están operando dentro de los parámetros normales de latencia.
            </p>
          </div>
          
          <div className="relative z-10 mt-8 space-y-4">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <span>Edge Network</span>
              <span className="text-emerald-300">Online</span>
            </div>
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <span>Realtime Sync</span>
              <span className="text-emerald-300">Active</span>
            </div>
          </div>

          {/* Abstract background shape */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};
