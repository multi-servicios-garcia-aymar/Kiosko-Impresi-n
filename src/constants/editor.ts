/**
 * Editor Configuration Constants
 * Modularized for Enterprise Scalability
 */

export const EDITOR_CONFIG = {
  ZOOM: {
    MIN: 0.1,
    MAX: 5,
    STEP: 0.05,
    PRECISION_STEP: 2,
    FAST_STEP: 10,
  },
  ASPECT_RATIO: 3 / 4,
  PRESET_COLORS: [
    'transparent', 
    '#ffffff', 
    '#e5c8e2', // Requested Pink
    '#8dd1e7', // Requested Blue
    '#f1f5f9', 
    '#e2e8f0', 
    '#cbd5e1', 
    '#3b82f6', 
    '#10b981',
    '#ef4444', // Red for passports
    '#fca311', // Orange
    '#000000', // Black
  ] as const,
  CHECKERBOARD: {
    PATTERN: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
    SIZE: '20px 20px',
    POSITION: '0 0, 0 10px, 10px -10px, -10px 0px',
  }
};

export type EditorColor = typeof EDITOR_CONFIG.PRESET_COLORS[number] | string;
