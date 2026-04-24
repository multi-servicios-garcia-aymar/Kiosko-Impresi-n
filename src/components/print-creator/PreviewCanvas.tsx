import React from 'react';
import { PhotoTemplate, PhotoData } from '../../types/photo';
import { getLayoutDimensions } from '../../lib/layouts';

interface PreviewCanvasProps {
  selectedTemplate: PhotoTemplate;
  totalPages: number;
  photosPerPage: number;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement>;
  getPhotoForSlot: (index: number) => PhotoData | null;
  getPreviewGridStyles: () => React.CSSProperties;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  selectedTemplate,
  totalPages,
  photosPerPage,
  scale,
  containerRef,
  getPhotoForSlot,
  getPreviewGridStyles
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 bg-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 text-center bg-white/80 backdrop-blur-md py-2 z-10 border-b border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">
          Vista Previa ({totalPages} {totalPages === 1 ? 'Hoja' : 'Hojas'} {selectedTemplate.pageSize})
        </h2>
        <p className="text-[10px] text-slate-400 italic">Ajusta tu foto arrastrándola en el recuadro resaltado</p>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full flex flex-col items-center pt-16 pb-8 px-4 snap-y snap-mandatory scroll-smooth"
      >
        <div 
          className="flex flex-col gap-8 items-center origin-top shrink-0 w-full"
          style={{ transform: `scale(${scale})` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div 
              key={pageIndex}
              className="bg-white shadow-xl border border-slate-200 relative overflow-hidden flex items-center justify-center shrink-0 snap-center"
              style={{
                width: `${selectedTemplate.pageWidth * 3.78}px`,
                height: `${selectedTemplate.pageHeight * 3.78}px`,
              }}
            >
              <div 
                className="w-full h-full"
                style={getPreviewGridStyles()}
              >
                {Array.from({ length: photosPerPage }).map((_, slotIndex) => {
                  const globalIndex = pageIndex * photosPerPage + slotIndex;
                  const slotPhoto = getPhotoForSlot(globalIndex);
                  const layout = getLayoutDimensions(selectedTemplate);
                  const slot = layout.slotStyles(slotIndex);
                  
                  const multiplier = 3.78;
                  const isRotated = selectedTemplate.rotate === 90;
                  
                  const slotW_px = slot.width * multiplier;
                  const slotH_px = slot.height * multiplier;

                  return (
                    <div 
                      key={slotIndex}
                      className={`relative border border-dashed border-slate-200 overflow-hidden bg-slate-50`}
                      style={{
                        width: `${slotW_px}px`,
                        height: `${slotH_px}px`,
                        gridColumn: slot.gridColumn || 'auto',
                      }}
                    >
                      {slotPhoto ? (
                        <img
                          src={slotPhoto.croppedUrl}
                          alt={`Foto para imprimir slot ${globalIndex + 1}`}
                          className="absolute pointer-events-none select-none"
                          style={{
                            width: isRotated ? `${slotH_px}px` : `${slotW_px}px`,
                            height: isRotated ? `${slotW_px}px` : `${slotH_px}px`,
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) ${isRotated ? 'rotate(90deg)' : ''} scale(${slotPhoto.zoom}) rotate(${slotPhoto.rotation}deg)`,
                            objectFit: slot.isLarge ? 'cover' : 'contain'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {selectedTemplate.rotate ? selectedTemplate.photoHeight : selectedTemplate.photoWidth}x{selectedTemplate.rotate ? selectedTemplate.photoWidth : selectedTemplate.photoHeight}mm
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-slate-400 shrink-0 pb-8">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-medium italic">
            Dimensiones reales: {selectedTemplate.rotate ? selectedTemplate.photoHeight : selectedTemplate.photoWidth}mm x {selectedTemplate.rotate ? selectedTemplate.photoWidth : selectedTemplate.photoHeight}mm
          </p>
        </div>
      </div>
    </div>
  );
};
