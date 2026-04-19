import { useEffect } from 'react';
import { EDITOR_CONFIG } from '../constants/editor';

interface KeyboardOptions {
  onMove: (dx: number, dy: number) => void;
  enabled: boolean;
}

export const useEditorKeyboard = ({ onMove, enabled }: KeyboardOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using arrows in the editor
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const step = e.shiftKey ? EDITOR_CONFIG.ZOOM.FAST_STEP : EDITOR_CONFIG.ZOOM.PRECISION_STEP;
      
      switch (e.key) {
        case 'ArrowUp':
          onMove(0, -step);
          break;
        case 'ArrowDown':
          onMove(0, step);
          break;
        case 'ArrowLeft':
          onMove(-step, 0);
          break;
        case 'ArrowRight':
          onMove(step, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove, enabled]);
};
