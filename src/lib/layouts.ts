import { PhotoTemplate } from '../types/photo';

export interface LayoutDimensions {
  paddingX: number;
  paddingY: number;
  gapX: number;
  gapY: number;
  gridRows: string;
  gridCols: string;
  justifyContent?: string;
  alignContent?: string;
  slotStyles: (index: number) => {
    width: number;
    height: number;
    gridColumn?: string;
    isLarge?: boolean;
  };
}

export const getLayoutDimensions = (template: PhotoTemplate): LayoutDimensions => {
  if (template.layoutType === 'hybrid-carnet-plus') {
    // Exact logic inherited from carnet 4x2 grid
    const paddingX = (template.pageWidth - (template.photoWidth * 2)) / 3;
    const gapX = paddingX;
    const paddingY = (template.pageHeight - (template.photoHeight * 4)) / 5;
    const gapY = paddingY;
    const bigPhotoRowHeight = template.photoHeight * 2 + gapY;

    return {
      paddingX,
      paddingY,
      gapX,
      gapY,
      gridCols: `${template.photoWidth}mm ${template.photoWidth}mm`,
      gridRows: `${template.photoHeight}mm ${template.photoHeight}mm ${bigPhotoRowHeight}mm`,
      slotStyles: (index: number) => {
        const isLarge = index === 4;
        return {
          width: isLarge ? (template.photoWidth * 2 + gapX) : template.photoWidth,
          height: isLarge ? bigPhotoRowHeight : template.photoHeight,
          gridColumn: isLarge ? '1 / 3' : 'auto',
          isLarge
        };
      }
    };
  }

  // Specific logic for carnet 4 rows x 2 cols
  if (template.id === 'carnet') {
    const remainingWidth = template.pageWidth - (template.cols * template.photoWidth);
    const paddingX = remainingWidth / (2 * template.cols);
    const gapX = paddingX * 2;
    const remainingHeight = template.pageHeight - (template.rows * template.photoHeight);
    const paddingY = remainingHeight / (2 * template.rows);
    const gapY = paddingY * 2;

    return {
      paddingX,
      paddingY,
      gapX,
      gapY,
      gridCols: `repeat(${template.cols}, ${template.photoWidth}mm)`,
      gridRows: `repeat(${template.rows}, ${template.photoHeight}mm)`,
      slotStyles: () => ({
        width: template.photoWidth,
        height: template.photoHeight,
      })
    };
  }

  // Default Grid Layout logic (for passport, postal, etc)
  return {
    paddingX: 0,
    paddingY: 0,
    gapX: 0,
    gapY: 0,
    gridCols: `repeat(${template.cols}, ${template.photoWidth}mm)`,
    gridRows: `repeat(${template.rows}, ${template.photoHeight}mm)`,
    justifyContent: 'space-evenly',
    alignContent: 'space-evenly',
    slotStyles: () => ({
      width: template.photoWidth,
      height: template.photoHeight,
    })
  };
};
