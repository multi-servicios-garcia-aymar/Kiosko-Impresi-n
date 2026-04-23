import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, Loader2, Megaphone, Clock, MapPin, Globe, AlignLeft, ExternalLink, MousePointerClick } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KioskAd } from '../store/useAdStore';

interface AdModalProps {
  onClose: () => void;
  onSave: (ad: Partial<KioskAd>) => Promise<void>;
}

export const AdModal: React.FC<AdModalProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [duration, setDuration] = useState(5000);
  const [targetId, setTargetId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) {
      alert('Por favor agrega un título y una imagen');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `ad_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);

      await onSave({
        title,
        description: description || undefined,
        image_url: publicUrl,
        cta_text: ctaText || undefined,
        cta_url: ctaUrl || undefined,
        is_active: true,
        display_duration: duration,
        target_machine_id: targetId || null
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
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Nuevo Anuncio</h3>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-video rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group ${
              imagePreview ? 'border-transparent' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} className="w-full h-full object-contain relative z-10" alt="Preview" />
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-3xl" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Upload className="w-5 h-5" /> Cambiar Imagen
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Selecciona o arrastra una imagen</p>
                <p className="text-xs text-slate-400 mt-1">Recomendado: 1920x1080px (WebP/JPG)</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Título del Anuncio</label>
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
                <div className="flex items-center gap-1.5"><AlignLeft className="w-3 h-3" /> Descripción (Opcional)</div>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica de qué trata tu promoción..."
                rows={3}
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
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duración (ms)</div>
                </label>
                <input
                  type="number"
                  required
                  step="1000"
                  min="2000"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
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
            onClick={handleSubmit}
            disabled={isUploading || !title || !imageFile}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo Anuncio...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Publicar Ahora
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
