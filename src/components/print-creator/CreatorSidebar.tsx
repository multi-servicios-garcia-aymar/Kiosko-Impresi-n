import React from 'react';
import { Upload, FileDown, Printer } from 'lucide-react';
import { Gallery } from '../Gallery';
import { PhotoTemplate } from '../../types/photo';
import { GalleryPhoto } from '../../lib/storage';

interface CreatorSidebarProps {
  selectedTemplate: PhotoTemplate;
  galleryPhotos: GalleryPhoto[];
  photos: any[];
  isGeneratingPDF: boolean;
  showAllPhotos: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onAddFromGallery: (gp: GalleryPhoto) => void;
  onEditFromGallery: (gp: GalleryPhoto, e: React.MouseEvent) => void;
  onDeleteGalleryPhoto: (id: string, e: React.MouseEvent) => void;
  onRemoveFromQueue: (id: string, e: React.MouseEvent) => void;
  onQuantityChange: (gp: GalleryPhoto, e: React.ChangeEvent<HTMLInputElement>) => void;
  getQuantity: (id: string) => number;
  setShowAllPhotos: (show: boolean) => void;
  totalNeeded: number;
}

export const CreatorSidebar: React.FC<CreatorSidebarProps> = ({
  selectedTemplate,
  galleryPhotos,
  photos,
  isGeneratingPDF,
  showAllPhotos,
  fileInputRef,
  onFileChange,
  onDownloadPDF,
  onPrint,
  onAddFromGallery,
  onEditFromGallery,
  onDeleteGalleryPhoto,
  onRemoveFromQueue,
  onQuantityChange,
  getQuantity,
  setShowAllPhotos,
  totalNeeded
}) => {
  return (
    <div className="w-full lg:w-[360px] shrink-0 flex flex-col min-h-[500px] lg:min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col h-full p-4 space-y-4">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-slate-900 mb-1">{selectedTemplate.name}</h1>
          <p className="text-xs text-slate-500 leading-tight">{selectedTemplate.description}</p>
        </div>

        {/* Image Upload Button */}
        <section className="shrink-0 space-y-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">1. Sube una foto</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700">Subir nueva foto</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Se abrirá el editor</p>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/*"
            className="hidden"
          />
        </section>

        {/* Gallery Component */}
        <Gallery
          galleryPhotos={galleryPhotos}
          getGalleryPhotoQuantity={getQuantity}
          handleAddFromGallery={onAddFromGallery}
          handleEditFromGallery={onEditFromGallery}
          handleDeleteGalleryPhoto={onDeleteGalleryPhoto}
          handleRemoveFromGalleryQueue={onRemoveFromQueue}
          handleManualQuantityChange={onQuantityChange}
          showAllPhotos={showAllPhotos}
          setShowAllPhotos={setShowAllPhotos}
        />
      </div>

      {/* Print Button (Sticky Bottom) */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500">Total a imprimir:</span>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {totalNeeded} fotos
          </span>
        </div>
        <button
          onClick={onDownloadPDF}
          disabled={photos.length === 0 || isGeneratingPDF}
          className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
            photos.length > 0 && !isGeneratingPDF
              ? 'border-indigo-200 text-indigo-600 hover:bg-white hover:shadow-sm'
              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
          }`}
        >
          {isGeneratingPDF ? (
            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5" />
          )}
          {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
        </button>
        <button
          onClick={onPrint}
          disabled={photos.length === 0}
          className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            photos.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Printer className="w-4 h-4" />
          Imprimir en {selectedTemplate.pageSize}
        </button>
      </div>
    </div>
  );
};
