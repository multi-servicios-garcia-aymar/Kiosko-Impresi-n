import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { PhotoEditor } from './PhotoEditor';
import { SEO } from './SEO';
import { TemplateNav } from './TemplateNav';
import { CreatorSidebar } from './print-creator/CreatorSidebar';
import { PreviewCanvas } from './print-creator/PreviewCanvas';
import { PrintContent } from './print-creator/PrintContent';
import { usePrintEngine } from '../hooks/usePrintEngine';
import { generatePDF } from '../lib/pdfUtils';

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
    <div ref={wrapperRef} className="w-full h-full flex flex-col items-center justify-start overflow-y-auto lg:overflow-hidden print:overflow-visible bg-slate-50 print:bg-white print:block no-scrollbar">
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
        <TemplateNav
          templates={templates}
          selectedTemplate={selectedTemplate}
          onNavigateHome={navigateToHome}
          onSelectTemplate={navigateToTemplate}
        />

        <div className="flex flex-col-reverse lg:flex-row gap-6 print:hidden flex-1 min-h-0 mt-4 lg:mt-0">
          <CreatorSidebar 
            selectedTemplate={selectedTemplate}
            galleryPhotos={galleryPhotos}
            photos={photos}
            isGeneratingPDF={isGeneratingPDF}
            showAllPhotos={showAllPhotos}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onDownloadPDF={handleDownloadPDF}
            onPrint={handlePrint}
            onAddFromGallery={handleAddFromGallery}
            onEditFromGallery={handleEditFromGallery}
            onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
            onRemoveFromQueue={handleRemoveFromGalleryQueue}
            onQuantityChange={handleManualQuantityChange}
            getQuantity={getGalleryPhotoQuantity}
            setShowAllPhotos={setShowAllPhotos}
            totalNeeded={getTotalPhotosNeeded()}
          />

          <PreviewCanvas 
            selectedTemplate={selectedTemplate}
            totalPages={getTotalPages()}
            photosPerPage={getPhotosPerPage()}
            scale={scale}
            containerRef={containerRef}
            getPhotoForSlot={getPhotoForSlot}
            getPreviewGridStyles={getPreviewGridStyles}
          />
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
      <PrintContent 
        selectedTemplate={selectedTemplate}
        totalPages={getTotalPages()}
        photosPerPage={getPhotosPerPage()}
        getPhotoForSlot={getPhotoForSlot}
      />
    </div>
  );
};
