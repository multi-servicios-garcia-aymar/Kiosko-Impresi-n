import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, Loader2, Megaphone, Clock, MapPin, AlignLeft, MousePointerClick, Users, Layout, Zap, Hash, Plus, Trash2, Film, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KioskAd, AdMediaItem } from '../store/useAdStore';

interface AdModalProps {
  onClose: () => void;
  onSave: (ad: Partial<KioskAd>) => Promise<void>;
}

interface PendingMediaItem {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  duration: number;
}

export const AdModal: React.FC<AdModalProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [globalDuration, setGlobalDuration] = useState(5000);
  const [transitionDelay, setTransitionDelay] = useState(500);
  const [targetId, setTargetId] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'registered' | 'anonymous' | 'trial'>('all');
  const [placement, setPlacement] = useState<'carousel' | 'sidebar' | 'overlay'>('carousel');
  const [displayMode, setDisplayMode] = useState<'fade' | 'slide' | 'zoom'>('fade');
  const [priority, setPriority] = useState(0);
  
  const [mediaItems, setMediaItems] = useState<PendingMediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaItems(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              file,
              preview: reader.result as string,
              type,
              duration: globalDuration
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateItemDuration = (id: string, newDuration: number) => {
    setMediaItems(prev => prev.map(item => 
      item.id === id ? { ...item, duration: newDuration } : item
    ));
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || mediaItems.length === 0) {
      alert('Por favor agrega un título y al menos un archivo multimedia');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedMedia: AdMediaItem[] = [];

      for (const item of mediaItems) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `ad_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ads')
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ads')
          .getPublicUrl(filePath);

        uploadedMedia.push({
          url: publicUrl,
          type: item.type,
          duration: item.duration
        });
      }

      await onSave({
        title,
        description: description || undefined,
        image_url: uploadedMedia[0].url, // Use first as thumbnail
        media_items: uploadedMedia,
        cta_text: ctaText || undefined,
        cta_url: ctaUrl || undefined,
        is_active: true,
        display_duration: uploadedMedia.reduce((acc, curr) => acc + (curr.duration || 0), 0),
        target_machine_id: targetId || null,
        target_audience: targetAudience,
        placement,
        display_mode: displayMode,
        transition_delay: transitionDelay,
        priority
      });
      
      onClose();
    } catch (err) {
      console.error('Error in ad creation:', err);
      alert('Hubo un error al crear el anuncio.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Nuevo Anuncio Multimedia</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Creador de Campañas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="ad-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Media Items Area */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Archivos del Anuncio (Imágenes y Videos)</label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {mediaItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 group border border-slate-200 shadow-sm"
                  >
                    {item.type === 'image' ? (
                      <img src={item.preview} className="w-full h-full object-contain" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-4">
                        <Film className="w-8 h-8 mb-2 text-indigo-400" />
                        <span className="text-[8px] font-bold text-center break-all opacity-60 px-2 leading-tight">{item.file.name}</span>
                        <div className="mt-2 bg-indigo-500/20 px-2 py-0.5 rounded-full text-[7px] uppercase font-bold">Video Clip</div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-90 z-20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-900/80 to-transparent flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/70" />
                        <input
                          type="number"
                          value={item.duration}
                          onChange={(e) => updateItemDuration(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded outline-none transition-all"
                        />
                        <span className="text-[8px] text-white/50 font-bold uppercase">ms</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 flex flex-col items-center justify-center gap-2 group transition-all text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/30"
              >
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight">Agregar Media</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept="image/*,video/*" 
            />
            
            <div className="flex items-center justify-between px-1">
              <p className="text-[9px] text-slate-400 flex items-center gap-2 italic">
                <Zap className="w-3 h-3" /> Si agregas varios archivos, se alternarán según la duración especificada.
              </p>
              <p className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                Duración Total: {(mediaItems.reduce((acc, curr) => acc + curr.duration, 0) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Título de la Campaña</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Promo Verano 2024"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duración Global Base (ms)</div>
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={globalDuration}
                  onChange={(e) => setGlobalDuration(parseInt(e.target.value) || 5000)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                <div className="flex items-center gap-1.5"><AlignLeft className="w-3 h-3" /> Mensaje / Copia</div>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica de qué trata tu promoción..."
                rows={2}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium resize-none"
              />
            </div>

            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
               <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                 <MousePointerClick className="w-3 h-3" /> Botón de Acción (Opcional)
               </h4>
               <div className="grid grid-cols-2 gap-3">
                 <input
                   type="text"
                   value={ctaText}
                   onChange={(e) => setCtaText(e.target.value)}
                   placeholder="Texto (Ej: Ver Oferta)"
                   className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium text-sm"
                 />
                 <input
                   type="url"
                   value={ctaUrl}
                   onChange={(e) => setCtaUrl(e.target.value)}
                   placeholder="URL de destino"
                   className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium text-sm"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Animación de Transición (ms)</div>
                </label>
                <input
                  type="number"
                  required
                  step="100"
                  min="0"
                  value={transitionDelay}
                  onChange={(e) => setTransitionDelay(parseInt(e.target.value) || 500)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> ID Máquina (Opcional)</div>
                </label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="ID específico o vacío"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> ¿Quién lo recibe?</div>
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm appearance-none"
                >
                  <option value="all">Todos los Usuarios</option>
                  <option value="registered">Solo Registrados</option>
                  <option value="anonymous">Solo Anónimos</option>
                  <option value="trial">Usuarios en Prueba (Sin Licencia)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Layout className="w-3 h-3" /> Estrategia Visual</div>
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm appearance-none"
                >
                  <option value="carousel">Carrusel Principal (HD)</option>
                  <option value="sidebar">Barra Lateral (Eco)</option>
                  <option value="overlay">Superpuesto (Max)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Animación</div>
                </label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm appearance-none"
                >
                  <option value="fade">Desvanecer (Fade)</option>
                  <option value="slide">Deslizar (Slide)</option>
                  <option value="zoom">Zoom Suave</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                  <div className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> Prioridad (0-99)</div>
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            form="ad-form"
            type="submit"
            disabled={isUploading || !title || mediaItems.length === 0}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando Multimedia...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Lanzar Campaña
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
