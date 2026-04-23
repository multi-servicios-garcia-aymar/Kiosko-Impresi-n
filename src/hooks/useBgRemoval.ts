import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggerService';

export const useBgRemoval = () => {
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [bgStatus, setBgStatus] = useState('');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      logger.error('Failed to initialize AI Background Removal Worker', { error });
    }
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const removeBackground = useCallback((photoUrl: string, onSuccess: (url: string) => void) => {
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
        onSuccess(url);
        setIsRemovingBg(false);
        setBgStatus('');
        setBgProgress(100);
      } else if (type === 'error') {
        logger.error('Background removal error', { error });
        setIsRemovingBg(false);
        setBgStatus('Error al procesar');
        setBgProgress(0);
      }
    };

    workerRef.current.postMessage({ photoUrl });
  }, []);

  return {
    isRemovingBg,
    bgProgress,
    bgStatus,
    removeBackground
  };
};
