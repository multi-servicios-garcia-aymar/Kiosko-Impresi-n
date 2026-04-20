export interface PhotoTemplate {
  id: string;
  name: string;
  photoWidth: number; // in mm
  photoHeight: number; // in mm
  pageSize: 'A4' | 'A5' | 'A6';
  pageWidth: number; // in mm
  pageHeight: number; // in mm
  cols: number;
  rows: number;
  description: string;
  rotate?: number; // Optional rotation in degrees
  isCustom?: boolean;
  layoutType?: 'grid' | 'hybrid-carnet-plus';
}

export interface PhotoData {
  id: string;
  originalUrl: string;
  croppedUrl: string;
  quantity: number;
  zoom: number;
  rotation: number;
}

export const DEFAULT_TEMPLATES: PhotoTemplate[] = [
  {
    id: 'carnet',
    name: 'Tamaño Carnet',
    photoWidth: 40, // Rotated: Width becomes 40
    photoHeight: 30, // Rotated: Height becomes 30
    pageSize: 'A6',
    pageWidth: 105, // A6 Portrait
    pageHeight: 148.5,
    cols: 2,
    rows: 4,
    description: '30 x 40 mm - 8 fotos en A6 Vertical',
    rotate: 90
  },
  {
    id: 'passport',
    name: 'Foto Pasaporte',
    photoWidth: 50,
    photoHeight: 50,
    pageSize: 'A6',
    pageWidth: 105,
    pageHeight: 148.5,
    cols: 2,
    rows: 2,
    description: '50 x 50 mm - Optimizado para A6'
  },
  {
    id: 'postal',
    name: 'Foto Postal',
    photoWidth: 105,
    photoHeight: 148.5,
    pageSize: 'A6',
    pageWidth: 105,
    pageHeight: 148.5,
    cols: 1,
    rows: 1,
    description: '105 x 148.5 mm - Optimizado para A6'
  },
  {
    id: 'a5',
    name: 'Foto A5',
    photoWidth: 148.5,
    photoHeight: 210,
    pageSize: 'A5',
    pageWidth: 148.5,
    pageHeight: 210,
    cols: 1,
    rows: 1,
    description: '148.5 x 210 mm - Optimizado para A5'
  },
  {
    id: 'a4',
    name: 'Foto A4',
    photoWidth: 210,
    photoHeight: 297,
    pageSize: 'A4',
    pageWidth: 210,
    pageHeight: 297,
    cols: 1,
    rows: 1,
    description: '210 x 297 mm - Optimizado para A4'
  },
  {
    id: 'carnet-plus',
    name: 'Carnet Plus',
    photoWidth: 40,
    photoHeight: 30,
    pageSize: 'A6',
    pageWidth: 105,
    pageHeight: 148.5,
    cols: 2,
    rows: 4, // Theoretical slots if it were a grid, but we'll use 5 slots total
    description: '4 fotos carnet + 1 Ampliación Pro en A6',
    layoutType: 'hybrid-carnet-plus',
    rotate: 90
  }
];
