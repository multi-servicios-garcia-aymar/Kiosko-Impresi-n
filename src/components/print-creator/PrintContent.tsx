import React from 'react';
import { PhotoTemplate, PhotoData } from '../../types/photo';
import { getLayoutDimensions } from '../../lib/layouts';

interface PrintContentProps {
  selectedTemplate: PhotoTemplate;
  totalPages: number;
  photosPerPage: number;
  getPhotoForSlot: (index: number) => PhotoData | null;
}

export const PrintContent: React.FC<PrintContentProps> = ({
  selectedTemplate,
  totalPages,
  photosPerPage,
  getPhotoForSlot
}) => {
  const getPrintGridCSS = () => {
    const layout = getLayoutDimensions(selectedTemplate);

    return {
      display: 'grid',
      gridTemplateColumns: layout.gridCols,
      gridTemplateRows: layout.gridRows,
      padding: `${layout.paddingY}mm ${layout.paddingX}mm`,
      columnGap: `${layout.gapX}mm`,
      rowGap: `${layout.gapY}mm`,
      justifyContent: layout.justifyContent || 'start',
      alignContent: layout.alignContent || 'start',
      boxSizing: 'border-box' as const
    };
  };

  return (
    <div id="photo-print-container" className="hidden print:block">
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <div 
          key={pageIndex} 
          className="print-page hidden print:grid"
          style={getPrintGridCSS()}
        >
          {Array.from({ length: photosPerPage }).map((_, slotIndex) => {
            const globalIndex = pageIndex * photosPerPage + slotIndex;
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
  );
};
