import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'motion/react';
import { Upload, ZoomIn, ZoomOut, Eraser, Image as ImageIcon, Check, X, RotateCcw, RotateCw } from 'lucide-react';
import { getCroppedImg } from '../lib/imageUtils';

interface PhotoEditorProps {
  photoUrl: string | null;
  onSave: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ photoUrl, onSave, onCancel, aspect = 3 / 4 }) => {
  const [currentImage, setCurrentImage] = useState(photoUrl);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [bgStatus, setBgStatus] = useState('');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Inicializar Web Worker
    workerRef.current = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgColor, setBgColor] = useState('transparent');

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (currentImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(currentImage, croppedAreaPixels, rotation, bgColor);
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
      setBgProgress(0);
      return;
    }

    if (!photoUrl || !workerRef.current) return;

    setIsRemovingBg(true);
    setBgProgress(0);
    setBgStatus('Inicializando Motor de IA...');

    workerRef.current.onmessage = (e) => {
      const { type, data, error } = e.data;
      
      if (type === 'progress') {
        const percent = Math.round((data.current / data.total) * 100);
        setBgProgress(percent || 0);
        setBgStatus(`Procesando (${data.key || 'modelo'})...`);
      } else if (type === 'success') {
        const url = URL.createObjectURL(data);
        setCurrentImage(url);
        setBgRemoved(true);
        setIsRemovingBg(false);
        setBgStatus('');
      } else if (type === 'error') {
        console.error("Error removing background:", error);
        setIsRemovingBg(false);
        setBgStatus('Error al procesar');
      }
    };

    workerRef.current.postMessage({ photoUrl });
  };

  const bgColors = ['transparent', '#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#3b82f6', '#10b981'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Editor de Foto de Perfil</h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Cropper Area */}
          <div className="relative flex-1 bg-slate-900 min-h-[300px]">
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
                    backgroundColor: bgColor === 'transparent' ? '#0f172a' : bgColor,
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
          <div className="w-full md:w-72 p-6 bg-white overflow-y-auto border-l border-slate-200">
            <div className="space-y-6">
              {/* Zoom Control */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Zoom / Encuadre
                </label>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Arrastra la imagen para centrarla
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Rotation Control */}
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
              {bgRemoved && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Reemplazar Fondo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {bgColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          bgColor === color ? 'border-indigo-600 scale-110' : 'border-slate-200'
                        }`}
                        style={{ 
                          backgroundColor: color === 'transparent' ? '#fff' : color,
                          backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                          backgroundSize: color === 'transparent' ? '10px 10px' : 'auto',
                          backgroundPosition: color === 'transparent' ? '0 0, 0 5px, 5px -5px, -5px 0px' : '0% 0%'
                        }}
                        title={color === 'transparent' ? 'Transparente' : color}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
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
