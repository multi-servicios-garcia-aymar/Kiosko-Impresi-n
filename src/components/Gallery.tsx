import React from 'react';
import { Library, Edit2, Trash2, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { GalleryPhoto } from '../lib/storage';
import { VirtuosoGrid } from 'react-virtuoso';
import { usePhotoStore } from '../store/usePhotoStore';

interface GalleryProps {
  galleryPhotos: GalleryPhoto[];
  getGalleryPhotoQuantity: (id: string) => number;
  handleAddFromGallery: (photo: GalleryPhoto) => void;
  handleEditFromGallery: (photo: GalleryPhoto, e: React.MouseEvent) => void;
  handleDeleteGalleryPhoto: (id: string, e: React.MouseEvent) => void;
  handleRemoveFromGalleryQueue: (id: string, e: React.MouseEvent) => void;
  handleManualQuantityChange: (photo: GalleryPhoto, e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  galleryPhotos,
  getGalleryPhotoQuantity,
  handleAddFromGallery,
  handleEditFromGallery,
  handleDeleteGalleryPhoto,
  handleRemoveFromGalleryQueue,
  handleManualQuantityChange,
}) => {
  const syncStatus = usePhotoStore((state) => state.syncStatus);

  const getSyncIndicator = () => {
    switch (syncStatus) {
      case 'connecting':
        return (
          <div className="flex items-center gap-1 text-[9px] text-amber-500 animate-pulse bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sincronizando...
          </div>
        );
      case 'synced':
        return (
          <div className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-2.5 h-2.5" /> En la Nube
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
            <CloudOff className="w-2.5 h-2.5" /> Error Sinc.
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
            <Cloud className="w-2.5 h-2.5" /> Solo Local
          </div>
        );
    }
  };

  return (
    <section className="flex flex-col min-h-[160px] flex-1 space-y-2 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <Library className="w-3 h-3" /> 2. Tu Galería
        </h2>
        {getSyncIndicator()}
      </div>
      {galleryPhotos.length === 0 ? (
        <div className="text-center p-4 text-slate-400 text-[10px] italic bg-slate-50 rounded-xl flex-1 flex items-center justify-center border border-slate-100">
          Las fotos que edites se guardarán aquí automáticamente.
        </div>
      ) : (
        <div className="flex-1 min-h-0 pr-1">
          <VirtuosoGrid
            totalCount={galleryPhotos.length}
            listClassName="grid grid-cols-3 gap-2"
            itemContent={(index) => {
              const gp = galleryPhotos[index];
              const quantity = getGalleryPhotoQuantity(gp.id);
              return (
                <div
                  className={`relative group rounded-lg overflow-hidden border aspect-square bg-slate-50 transition-colors ${
                    quantity > 0 ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <img
                    src={gp.url}
                    alt="Gallery item"
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => handleAddFromGallery(gp)}
                  />

                  {/* Quantity Badge (Top Left) */}
                  {quantity > 0 && (
                    <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm z-10">
                      {quantity}
                    </div>
                  )}

                  {/* Actions (Top Right) */}
                  <div className="absolute top-1 right-1 flex gap-1 lg:opacity-0 opacity-100 lg:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => handleEditFromGallery(gp, e)}
                      className="p-1.5 lg:p-1 bg-white/90 text-indigo-600 rounded drop-shadow hover:bg-white"
                      title="Editar foto"
                      aria-label="Editar foto"
                    >
                      <Edit2 className="w-4 h-4 lg:w-3 lg:h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteGalleryPhoto(gp.id, e)}
                      className="p-1.5 lg:p-1 bg-white/90 text-red-600 rounded drop-shadow hover:bg-white"
                      title="Eliminar de la galería"
                      aria-label="Eliminar de la galería"
                    >
                      <Trash2 className="w-4 h-4 lg:w-3 lg:h-3" />
                    </button>
                  </div>

                  {/* Counter UI (Bottom) */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-1 flex items-center justify-between lg:opacity-0 opacity-100 lg:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => handleRemoveFromGalleryQueue(gp.id, e)}
                      disabled={quantity === 0}
                      className="w-8 h-8 lg:w-6 lg:h-6 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-medium text-lg lg:text-base"
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantity === 0 ? '' : quantity}
                      placeholder="Añadir"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleManualQuantityChange(gp, e)}
                      className="w-12 lg:w-10 text-center text-xs lg:text-[10px] font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 m-0 placeholder:text-slate-700 placeholder:font-bold hide-number-spinners"
                      aria-label="Cantidad a imprimir"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFromGallery(gp);
                      }}
                      className="w-8 h-8 lg:w-6 lg:h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 font-medium text-lg lg:text-base"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </section>
  );
};
