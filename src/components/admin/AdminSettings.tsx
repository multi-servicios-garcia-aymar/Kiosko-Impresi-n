import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../services/LoggerService';
import { toast } from 'react-hot-toast';

interface Setting {
  key: string;
  value: any;
  description: string;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      setSettings(data || []);
    } catch (e: any) {
      logger.error('Failed to fetch settings', e);
      toast.error('Error al cargar configuraciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateValue = (key: string, newValue: string) => {
    setSettings(prev => prev.map(s => {
      if (s.key === key) {
        try {
          return { ...s, value: JSON.parse(newValue) };
        } catch {
          return { ...s, value: newValue };
        }
      }
      return s;
    }));
  };

  const saveSetting = async (setting: Setting) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: setting.key, 
          value: setting.value,
          description: setting.description 
        });
      
      if (error) throw error;
      toast.success(`Configuración "${setting.key}" guardada`);
    } catch (e: any) {
      logger.error('Failed to save setting', e);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h2>
          <p className="text-slate-500">Administra parámetros globales y Remote Config</p>
        </div>
        <button 
          onClick={fetchSettings}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="text-amber-900 font-bold">No hay configuraciones activas</p>
            <p className="text-amber-700 text-sm mt-1">Implementa el archivo SQL para habilitar Remote Config.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {settings.map((setting) => (
            <div key={setting.key} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">{setting.key}</span>
                </div>
                <p className="text-slate-500 text-sm">{setting.description}</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  type="text"
                  value={typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value}
                  onChange={(e) => handleUpdateValue(setting.key, e.target.value)}
                  className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={() => saveSetting(setting)}
                  disabled={isSaving}
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  title="Guardar cambios"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2">Seguridad Avanzada</h3>
          <p className="text-slate-400 text-sm max-w-lg mb-6">
            Todos los cambios son auditados y almacenados en la tabla de Audit Logs. Solo usuarios con rol Super Admin pueden modificar estos parámetros.
          </p>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-medium border border-white/10">Version 2.0</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-medium border border-white/10">Encryption Active</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32" />
      </div>
    </div>
  );
};
