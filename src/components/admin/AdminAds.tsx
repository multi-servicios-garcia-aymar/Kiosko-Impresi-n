import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, Plus, Trash, Globe, MapPin, Clock, Layout, Users, Zap, Layers, Play } from 'lucide-react';
import { KioskAd } from '../../store/useAdStore';
import { toast } from 'react-hot-toast';
import { logger } from '../../services/LoggerService';

interface AdminAdsProps {
  ads: KioskAd[];
  isLoading: boolean;
  onNewAd: () => void;
  onUpdateAd: (id: string, updates: Partial<KioskAd>) => void;
  onDeleteAd: (id: string) => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ ads, isLoading, onNewAd, onUpdateAd, onDeleteAd }) => {
  const handleToggleActive = async (ad: KioskAd) => {
    try {
      await onUpdateAd(ad.id, { is_active: !ad.is_active });
      toast.success(ad.is_active ? 'Anuncio desactivado' : 'Anuncio activado');
    } catch (e) {
      logger.error('Failed to toggle ad status', e);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDelete = async (ad: KioskAd) => {
    if (confirm(`¿Eliminar anuncio "${ad.title}" permanentemente?`)) {
      try {
        await onDeleteAd(ad.id);
        toast.success('Anuncio eliminado');
      } catch (e) {
        logger.error('Failed to delete ad', e);
        toast.error('Error al eliminar');
      }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestión de Publicidad</h2>
          <p className="text-sm text-slate-500">Configura los banners que verán tus usuarios en los kioskos.</p>
        </div>
        <button 
          onClick={onNewAd}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Anuncio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
          ))
        ) : ads.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No hay anuncios configurados.</p>
          </div>
        ) : (
          ads.map((ad) => (
            <motion.div
              key={ad.id}
              layoutId={ad.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
            >
              <div className="aspect-video relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                <img 
                  src={ad.image_url} 
                  alt={ad.title} 
                  className="max-w-full max-h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${ad.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {ad.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {ad.media_items && ad.media_items.length > 1 && (
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-sm border border-slate-100">
                      <Layers className="w-3 h-3" /> {ad.media_items.length} Archivos
                    </span>
                  )}
                  {ad.media_items?.some(m => m.type === 'video') && (
                    <span className="px-2 py-1 bg-indigo-500 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Play className="w-3 h-3 fill-current" /> Video
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-slate-900 mb-1">{ad.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium mb-4">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {ad.display_duration / 1000}s</span>
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase font-bold"><Layout className="w-3 h-3" /> {ad.placement}</span>
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase font-bold">
                    <Users className="w-3 h-3" /> 
                    {ad.target_audience === 'trial' ? 'En Prueba' : ad.target_audience}
                  </span>
                  <span className="flex items-center gap-1 bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full uppercase font-bold"><Zap className="w-3 h-3" /> {ad.display_mode}</span>
                  <span className="flex items-center gap-1">
                    {ad.target_machine_id ? (
                      <><MapPin className="w-3 h-3" /> {ad.target_machine_id}</>
                    ) : (
                      <><Globe className="w-3 h-3" /> Global</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleToggleActive(ad)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      ad.is_active ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {ad.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button 
                    onClick={() => handleDelete(ad)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
