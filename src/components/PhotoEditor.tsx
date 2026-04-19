import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'motion/react';
import { 
  Upload, ZoomIn, ZoomOut, Eraser, Image as ImageIcon, Check, X, 
  RotateCcw, RotateCw, Palette, Trash2, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Move
} from 'lucide-react';
import { getCroppedImg } from '../lib/imageUtils';
import { EDITOR_CONFIG } from '../constants/editor';
import { useBgRemoval } from '../hooks/useBgRemoval';
import { useEditorKeyboard } from '../hooks/useEditorKeyboard';

interface PhotoEditorProps {
  photoUrl: string | null;
  onSave: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ 
  photoUrl, 
  onSave, 
  onCancel, 
  aspect = EDITOR_CONFIG.ASPECT_RATIO 
}) => {
  const [currentImage, setCurrentImage] = useState(photoUrl);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const bgInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const { isRemovingBg, bgProgress, bgStatus, removeBackground } = useBgRemoval();

  const adjustCrop = useCallback((dx: number, dy: number) => {
    setCrop(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  useEditorKeyboard({ onMove: adjustCrop, enabled: !!currentImage });

  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgColor, setBgColor] = useState('transparent');
  const [bgImg, setBgImg] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (currentImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(currentImage, croppedAreaPixels, rotation, bgColor, bgImg || undefined);
        onSave(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemoveBg = async () => {
    if (bgRemoved) {
      setCurrentImage(photoUrl);
      setBgRemoved(false);
      return;
    }

    if (!photoUrl) return;

    removeBackground(photoUrl, (processedUrl) => {
      setCurrentImage(processedUrl);
      setBgRemoved(true);
    });
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImg(url);
      setBgColor('transparent');
    }
    // Reset file input
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const bgColors = [
    'transparent', 
    '#ffffff', 
    '#e5c8e2', // Requested Pink
    '#8dd1e7', // Requested Blue
    '#f1f5f9', 
    '#e2e8f0', 
    '#cbd5e1', 
    '#3b82f6', 
    '#10b981'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[100dvh] md:max-h-[95vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800">Editor de Foto de Perfil</h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Cropper Area */}
          <div className="relative w-full h-[45vh] lg:flex-1 lg:h-auto bg-slate-900 shrink-0 overflow-hidden">
             {/* Permanent Background Layer (Always Behind) */}
             <div 
               className="absolute inset-0 z-0 bg-slate-900"
               style={{
                 backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                 backgroundImage: bgImg 
                  ? `url(${bgImg})` 
                  : (bgColor === 'transparent' 
                      ? EDITOR_CONFIG.CHECKERBOARD.PATTERN 
                      : 'none'),
                 backgroundSize: bgImg ? 'cover' : EDITOR_CONFIG.CHECKERBOARD.SIZE,
                 backgroundPosition: bgImg ? 'center' : EDITOR_CONFIG.CHECKERBOARD.POSITION,
                 backgroundRepeat: 'no-repeat'
               }}
             />
             
            {currentImage && (
              <Cropper
                image={currentImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                style={{
                  containerStyle: {
                    backgroundColor: 'transparent', 
                    backgroundImage: 'none',
                  },
                  mediaStyle: {
                    backgroundColor: 'transparent',
                  },
                  cropAreaStyle: {
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Darken areas outside crop
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  }
                }}
              />
            )}
            {isRemovingBg && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <div className="flex flex-col items-center text-white w-64 max-w-full px-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-medium mb-3">{bgStatus}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                      style={{ width: `${bgProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{bgProgress}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full lg:w-80 p-6 bg-white shrink-0 lg:shrink lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-200">
            <div className="space-y-6">
              {/* Zoom Control */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Zoom / Encuadre
                </label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setZoom(prev => Math.max(1, prev - 0.1))}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    title="Alejar"
                    aria-label="Alejar foto"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    value={zoom}
                    min={EDITOR_CONFIG.ZOOM.MIN}
                    max={EDITOR_CONFIG.ZOOM.MAX}
                    step={EDITOR_CONFIG.ZOOM.STEP}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <button 
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    title="Acercar"
                    aria-label="Acercar foto"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Arrastra la imagen para centrarla
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Precision Controls */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Move className="w-3 h-3" /> Ajuste de Precisión
                </label>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => adjustCrop(0, -2)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustCrop(-2, 0)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Mover izquierda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                    <button
                      onClick={() => adjustCrop(2, 0)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Mover derecha"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => adjustCrop(0, 2)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                  También puedes usar las flechas del teclado
                </p>
              </div>

              <hr className="border-slate-100" />
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Rotar
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRotation((prev) => prev - 90)}
                    className="flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    -90°
                  </button>
                  <button
                    onClick={() => setRotation((prev) => prev + 90)}
                    className="flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    +90°
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Background Removal */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Fondo Inteligente
                </label>
                <button
                  onClick={handleRemoveBg}
                  disabled={isRemovingBg}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    bgRemoved 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  {bgRemoved ? 'Restaurar Fondo Original' : 'Eliminar Fondo (IA)'}
                </button>
              </div>

              {/* Background Replacement */}
              <div className="space-y-4">
                <hr className="border-slate-100" />
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Color de Fondo
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EDITOR_CONFIG.PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setBgColor(color);
                          setBgImg(null);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          bgColor === color && !bgImg ? 'border-indigo-600 scale-110 shadow-md' : 'border-slate-200'
                        }`}
                        style={{ 
                          backgroundColor: color === 'transparent' ? '#fff' : color,
                          backgroundImage: color === 'transparent' ? EDITOR_CONFIG.CHECKERBOARD.PATTERN : 'none',
                          backgroundSize: color === 'transparent' ? '10px 10px' : 'auto',
                          backgroundPosition: color === 'transparent' ? '0 0, 0 5px, 5px -5px, -5px 0px' : '0% 0%'
                        }}
                        title={color === 'transparent' ? 'Transparente' : color}
                      />
                    ))}
                    
                    {/* Native Color Picker Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => colorInputRef.current?.click()}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                          !EDITOR_CONFIG.PRESET_COLORS.includes(bgColor as any) && bgColor !== 'transparent' && !bgImg ? 'border-indigo-600 scale-110 shadow-md' : 'border-slate-200 border-dashed'
                        }`}
                        style={{ backgroundColor: !EDITOR_CONFIG.PRESET_COLORS.includes(bgColor as any) && !bgImg ? bgColor : '#fff' }}
                        title="Elegir otro color"
                      >
                        {EDITOR_CONFIG.PRESET_COLORS.includes(bgColor as any) || bgImg ? (
                          <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                        ) : null}
                      </button>
                      <input
                        type="color"
                        ref={colorInputRef}
                        value={bgColor !== 'transparent' ? bgColor : '#ffffff'}
                        onChange={(e) => {
                          setBgColor(e.target.value);
                          setBgImg(null);
                        }}
                        className="absolute opacity-0 w-0 h-0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Imagen de Fondo
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bgInputRef.current?.click()}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                        bgImg ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-dashed border-slate-200 hover:border-indigo-300 text-slate-600'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      {bgImg ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </button>
                    <input
                      type="file"
                      ref={bgInputRef}
                      accept="image/*"
                      onChange={handleBgImageUpload}
                      className="hidden"
                    />
                    {bgImg && (
                      <button
                        onClick={() => {
                          setBgImg(null);
                          setBgColor('transparent');
                        }}
                        className="w-10 flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Aplicar Foto
          </button>
        </div>
      </div>
    </div>
  );
};
