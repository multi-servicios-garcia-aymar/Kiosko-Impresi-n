import React from 'react';
import { Upload, Printer, FileDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { PhotoEditor } from './PhotoEditor';
import { Gallery } from './Gallery';
import { SEO } from './SEO';
import { TemplateNav } from './TemplateNav';
import { usePrintEngine } from '../hooks/usePrintEngine';
import { getLayoutDimensions } from '../lib/layouts';
import { generatePDF } from '../lib/pdfUtils';
import { useState } from 'react';

export const PhotoPrintCreator: React.FC = () => {
  const {
    templates,
    selectedTemplate,
    photos,
    galleryPhotos,
    editingImageUrl,
    scale,
    appScale,
    appDimensions,
    isMobile,
    wrapperRef,
    containerRef,
    fileInputRef,
    setEditingImageUrl,
    handleFileChange,
    handleSaveEditedPhoto,
    handleEditFromGallery,
    handleAddFromGallery,
    handleRemoveFromGalleryQueue,
    handleManualQuantityChange,
    getGalleryPhotoQuantity,
    handleDeleteGalleryPhoto,
    getTotalPhotosNeeded,
    getPhotosPerPage,
    getTotalPages,
    getPhotoForSlot,
    handlePrint,
    navigateToHome,
    navigateToTemplate,
    getPreviewGridStyles,
    printStyles,
    showAllPhotos,
    setShowAllPhotos
  } = usePrintEngine();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF(
        'photo-print-container', 
        `Impresion_${selectedTemplate.name}_${new Date().toLocaleDateString()}`,
        selectedTemplate.pageWidth,
        selectedTemplate.pageHeight
      );
    } catch (e) {
      console.error('PDF generation fails', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full h-full flex flex-col items-center justify-start overflow-y-auto lg:overflow-hidden print:overflow-visible bg-slate-50 print:bg-white print:block">
      <SEO 
        title={`Imprimir ${selectedTemplate.name}`}
        description={`Configura e imprime tus fotos en formato ${selectedTemplate.name} con las dimensiones correctas: ${selectedTemplate.photoWidth}x${selectedTemplate.photoHeight}mm.`}
      />
      <style>{printStyles}</style>
      
      <div 
        className="flex flex-col bg-slate-50 shrink-0 origin-top print:hidden w-full lg:h-full"
        style={!isMobile ? {
          width: `${appDimensions.width}px`,
          height: `${appDimensions.height}px`,
          transform: `scale(${appScale})`,
          padding: '24px'
        } : {
          padding: '16px',
          minHeight: '100%',
          width: '100%'
        }}
      >
        {/* Template Navigation Bar */}
        <TemplateNav
          templates={templates}
          selectedTemplate={selectedTemplate}
          onNavigateHome={navigateToHome}
          onSelectTemplate={navigateToTemplate}
        />

      <div className="flex flex-col-reverse lg:flex-row gap-6 print:hidden flex-1 min-h-0 mt-4 lg:mt-0">
        {/* Controls Panel */}
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
                aria-label="Subir fotos"
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
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </section>

            {/* Gallery Component */}
            <Gallery
              galleryPhotos={galleryPhotos}
              getGalleryPhotoQuantity={getGalleryPhotoQuantity}
              handleAddFromGallery={handleAddFromGallery}
              handleEditFromGallery={handleEditFromGallery}
              handleDeleteGalleryPhoto={handleDeleteGalleryPhoto}
              handleRemoveFromGalleryQueue={handleRemoveFromGalleryQueue}
              handleManualQuantityChange={handleManualQuantityChange}
              showAllPhotos={showAllPhotos}
              setShowAllPhotos={setShowAllPhotos}
            />

          </div>

          {/* Print Button (Sticky Bottom) */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500">Total a imprimir:</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {getTotalPhotosNeeded()} fotos
              </span>
            </div>
            <button
              onClick={handleDownloadPDF}
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
              onClick={handlePrint}
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

        {/* Preview Area */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 bg-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 text-center bg-white/80 backdrop-blur-md py-2 z-10 border-b border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Vista Previa ({getTotalPages()} {getTotalPages() === 1 ? 'Hoja' : 'Hojas'} {selectedTemplate.pageSize})</h2>
            <p className="text-[10px] text-slate-400 italic">Ajusta tu foto arrastrándola en el recuadro resaltado</p>
          </div>

          {/* Sheet Previews */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto w-full flex flex-col items-center pt-16 pb-8 px-4 snap-y snap-mandatory scroll-smooth"
          >
            <div 
              className="flex flex-col gap-8 items-center origin-top shrink-0 w-full"
              style={{ transform: `scale(${scale})` }}
            >
              {Array.from({ length: getTotalPages() }).map((_, pageIndex) => (
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
                    {Array.from({ length: getPhotosPerPage() }).map((_, slotIndex) => {
                      const globalIndex = pageIndex * getPhotosPerPage() + slotIndex;
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
                              alt={`Foto para imprimir slot ${globalIndex + 1} - Formato ${selectedTemplate.name}`}
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
              <p className="text-[10px] font-medium italic">Dimensiones reales: {selectedTemplate.rotate ? selectedTemplate.photoHeight : selectedTemplate.photoWidth}mm x {selectedTemplate.rotate ? selectedTemplate.photoWidth : selectedTemplate.photoHeight}mm</p>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Photo Editor Modal */}
      <AnimatePresence>
        {editingImageUrl && (
          <PhotoEditor
            photoUrl={editingImageUrl}
            aspect={selectedTemplate.rotate ? selectedTemplate.photoHeight / selectedTemplate.photoWidth : selectedTemplate.photoWidth / selectedTemplate.photoHeight}
            onSave={handleSaveEditedPhoto}
            onCancel={() => setEditingImageUrl(null)}
          />
        )}
      </AnimatePresence>

      {/* Hidden Print Content */}
      <div id="photo-print-container" className="hidden print:block">
        {Array.from({ length: getTotalPages() }).map((_, pageIndex) => (
          <div key={pageIndex} className="print-page hidden print:grid">
            {Array.from({ length: getPhotosPerPage() }).map((_, slotIndex) => {
              const globalIndex = pageIndex * getPhotosPerPage() + slotIndex;
              const slotPhoto = getPhotoForSlot(globalIndex);
              const layout = getLayoutDimensions(selectedTemplate);
              const slot = layout.slotStyles(slotIndex);
              
              const isRotated = selectedTemplate.rotate === 90;
              const slotW_mm = slot.width;
              const slotH_mm = slot.height;

              return (
                <div key={slotIndex} className="print-photo-container overflow-hidden relative"
                  style={{ 
                    width: `${slotW_mm}mm`, 
                    height: `${slotH_mm}mm`,
                    gridColumn: slot.gridColumn || 'auto',
                    boxSizing: 'border-box'
                  }}
                >
                  {slotPhoto && (
                    <img
                      src={slotPhoto.croppedUrl}
                      className="absolute left-1/2 top-1/2"
                      style={{
                        width: isRotated ? `${slotH_mm}mm` : `${slotW_mm}mm`,
                        height: isRotated ? `${slotW_mm}mm` : `${slotH_mm}mm`,
                        transform: `translate(-50%, -50%) ${isRotated ? 'rotate(90deg)' : ''} scale(${slotPhoto.zoom}) rotate(${slotPhoto.rotation}deg)`,
                        objectFit: slot.isLarge ? 'cover' : 'contain'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
