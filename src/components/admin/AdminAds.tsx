import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Plus, Trash, Globe, MapPin, Clock, Layout, Users, Zap, Layers, Play, Info, X, FileText, AlignLeft } from 'lucide-react';
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
  const [showSpecs, setShowSpecs] = useState(false);
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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSpecs(true)}
            className="px-4 py-2.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-indigo-500" />
            Formatos
          </button>
          <button 
            onClick={onNewAd}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Anuncio
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSpecs && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSpecs(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Guía de Publicidad</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Requerimientos Técnicos Kiosko</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSpecs(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Carrusel Principal',
                    aspect: '3:1 o 2:1',
                    size: '1920x640px',
                    pos: 'Banner Superior',
                    icon: <Layout className="w-5 h-5" />
                  },
                  {
                    title: 'Barra Lateral',
                    aspect: '3:4 / 9:16',
                    size: '600x800px',
                    pos: 'Contenido Vertical',
                    icon: <AlignLeft className="w-5 h-5" />
                  },
                  {
                    title: 'Overlay / Splash',
                    aspect: '4:3 o 1:1',
                    size: '1080x1440px',
                    pos: 'Pop-up Principal',
                    icon: <Zap className="w-5 h-5" />
                  },
                  {
                    title: 'Videos (General)',
                    aspect: 'MP4 / H.264',
                    size: 'Max 20MB',
                    pos: 'Optimizado Kiosko',
                    icon: <Play className="w-5 h-5" />
                  }
                ].map((spec, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4 items-center group hover:border-indigo-100 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                      {spec.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{spec.title}</h4>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase">{spec.aspect} • {spec.size}</p>
                      <p className="text-[10px] text-slate-400 font-medium italic">{spec.pos}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex gap-4 items-start">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-1">Recomendaciones de Archivo</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Usa formatos <b>WEBP</b> o <b>JPG</b> para fotos. Para videos usa Bitrate bajo. Se recomienda no exceder los 15 segundos por anuncio.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSpecs(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                Cerrar Guía
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
