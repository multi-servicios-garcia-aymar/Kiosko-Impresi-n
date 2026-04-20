import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePhotoStore } from '../store/usePhotoStore';
import { GalleryPhoto } from '../lib/storage';
import { PhotoData, DEFAULT_TEMPLATES } from '../types/photo';
import { compressImage } from '../lib/imageUtils';

export const usePrintEngine = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const {
    templates,
    selectedTemplate,
    photos,
    galleryPhotos,
    editingImageUrl,
    showAllPhotos,
    setTemplates,
    setSelectedTemplate,
    setPhotos,
    setEditingImageUrl,
    setShowAllPhotos,
    loadPhotosForTemplate,
    savePhotosForTemplate,
    loadGalleryPhotos,
    addPhotoToGallery,
    removePhotoFromGallery
  } = usePhotoStore();

  const [scale, setScale] = useState(1);
  const [appScale, setAppScale] = useState(1);
  const [appDimensions, setAppDimensions] = useState({ width: 1280, height: 800 });
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // App global scaling
  useEffect(() => {
    const updateAppScale = () => {
      if (wrapperRef.current) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        if (clientWidth < 1024) {
          setIsMobile(true);
          setAppScale(1);
          setAppDimensions({ width: clientWidth, height: clientHeight });
        } else {
          setIsMobile(false);
          const newScale = Math.min(clientWidth / 1280, clientHeight / 800);
          setAppScale(newScale);
          setAppDimensions({
            width: clientWidth / newScale,
            height: clientHeight / newScale
          });
        }
      }
    };

    window.addEventListener('resize', updateAppScale);
    updateAppScale();
    const timeoutId = setTimeout(updateAppScale, 50);

    return () => {
      window.removeEventListener('resize', updateAppScale);
      clearTimeout(timeoutId);
    };
  }, []);

  // Bootstrapping Custom Templates and Gallery
  useEffect(() => {
    const savedTemplates = localStorage.getItem('customPhotoTemplates');
    let allTemplates = [...DEFAULT_TEMPLATES];
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        allTemplates = [...DEFAULT_TEMPLATES, ...parsed];
        setTemplates(allTemplates);
      } catch (e) {
        console.error('Failed to parse custom templates', e);
      }
    }
    
    if (templateId) {
      const found = allTemplates.find(t => t.id === templateId);
      if (found) {
        setSelectedTemplate(found);
      } else {
        navigate('/');
      }
    }

    // Load gallery first, THEN trigger a template load once gallery is hydrated
    loadGalleryPhotos().then(() => {
      if (templateId) {
        loadPhotosForTemplate(templateId);
      }
    });
  }, [templateId, navigate, setTemplates, setSelectedTemplate, loadGalleryPhotos, loadPhotosForTemplate]);

  const activeTemplateRef = useRef<string | null>(null);

  // Sync with template
  useEffect(() => {
    if (templateId && activeTemplateRef.current !== templateId) {
      activeTemplateRef.current = templateId;
      setPhotos([]); // Clear intermediate state instantly to prevent visual artifacts
      // The actual load is now handled in the bootstrap hook above or standard hook below 
      // but only IF galleryPhotos is already hydrated.
      if (galleryPhotos.length > 0) {
        loadPhotosForTemplate(templateId);
      }
    }
  }, [templateId, loadPhotosForTemplate, setPhotos, galleryPhotos]);

  useEffect(() => {
    // Only save if the template is fully active.
    if (activeTemplateRef.current) {
      savePhotosForTemplate(activeTemplateRef.current);
    }
  }, [photos, savePhotosForTemplate]);

  useEffect(() => {
    const customTemplates = templates.filter(t => t.isCustom);
    localStorage.setItem('customPhotoTemplates', JSON.stringify(customTemplates));
  }, [templates]);

  // Preview Grid scale
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const containerHeight = containerRef.current.clientHeight - 96; 
        
        const targetWidth = selectedTemplate.pageWidth * 3.78;
        const targetHeight = selectedTemplate.pageHeight * 3.78;
        
        const scaleWidth = containerWidth / targetWidth;
        const scaleHeight = containerHeight / targetHeight;
        
        const newScale = Math.min(scaleWidth, scaleHeight, 1);
        setScale(newScale);
      }
    };

    const observer = new ResizeObserver(updateScale);
    window.addEventListener('resize', updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    updateScale();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [selectedTemplate]);

  // Interaction handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const file = files[0];
    const compressedDataUrl = await compressImage(file);
    setEditingImageUrl(compressedDataUrl);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveEditedPhoto = async (croppedImage: string) => {
    if (!templateId) return;
    const newPhoto = await addPhotoToGallery(croppedImage, templateId);
    if (newPhoto) {
      handleAddFromGallery(newPhoto);
    }
    setEditingImageUrl(null);
  };

  const handleEditFromGallery = (gp: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingImageUrl(gp.url);
  };

  const handleAddFromGallery = (gp: GalleryPhoto) => {
    setPhotos((prev) => {
      const existingPhoto = prev.find(p => p.id === gp.id);
      if (existingPhoto) {
        return prev.map(p => p.id === gp.id ? { ...p, quantity: p.quantity + 1 } : p);
      } else {
        const newPhoto: PhotoData = {
          id: gp.id,
          originalUrl: gp.url,
          croppedUrl: gp.url,
          quantity: 1,
          zoom: 1,
          rotation: 0
        };
        return [...prev, newPhoto];
      }
    });
  };

  const handleRemoveFromGalleryQueue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) => {
      const existingPhoto = prev.find(p => p.id === id);
      if (existingPhoto && existingPhoto.quantity > 1) {
        return prev.map(p => p.id === id ? { ...p, quantity: p.quantity - 1 } : p);
      } else {
        return prev.filter(p => p.id !== id);
      }
    });
  };

  const handleManualQuantityChange = (gp: GalleryPhoto, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = e.target.value;
    
    if (val === '') {
      setPhotos((prev) => prev.filter(p => p.id !== gp.id));
      return;
    }

    const newQuantity = parseInt(val, 10);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    setPhotos((prev) => {
      const existingPhoto = prev.find(p => p.id === gp.id);
      if (newQuantity === 0) {
        return prev.filter(p => p.id !== gp.id);
      }
      if (existingPhoto) {
        return prev.map(p => p.id === gp.id ? { ...p, quantity: newQuantity } : p);
      } else {
        const newPhoto: PhotoData = {
          id: gp.id,
          originalUrl: gp.url,
          croppedUrl: gp.url,
          quantity: newQuantity,
          zoom: 1,
          rotation: 0
        };
        return [...prev, newPhoto];
      }
    });
  };

  const getGalleryPhotoQuantity = (id: string) => {
    const photo = photos.find(p => p.id === id);
    return photo ? photo.quantity : 0;
  };

  const handleDeleteGalleryPhoto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removePhotoFromGallery(id);
  };

  // Math helpers
  const getTotalPhotosNeeded = () => photos.reduce((sum, p) => sum + p.quantity, 0);
  const getPhotosPerPage = () => {
    if (selectedTemplate.layoutType === 'hybrid-carnet-plus') return 5;
    return selectedTemplate.cols * selectedTemplate.rows;
  };

  const getTotalPages = () => Math.max(1, Math.ceil(getTotalPhotosNeeded() / getPhotosPerPage()));

  const getPhotoForSlot = (index: number): PhotoData | null => {
    if (photos.length === 0) return null;
    const flattenedPhotos: PhotoData[] = [];
    photos.forEach((photo) => {
      for (let j = 0; j < photo.quantity; j++) {
        flattenedPhotos.push(photo);
      }
    });
    return flattenedPhotos[index] || null;
  };

  const handlePrint = () => window.print();
  const navigateToHome = () => navigate('/');
  const navigateToTemplate = (id: string) => navigate(`/photo-print/${id}`);

  // Styles logic
  const getPrintGridCSS = () => {
    if (selectedTemplate.layoutType === 'hybrid-carnet-plus') {
      const paddingX = 6.25; // Exact margin from 'carnet'
      const gapX = 12.5; // Exact gap from 'carnet'
      const paddingY = 3.5625; // Exact top margin from 'carnet'
      const gapY = 7.125; // Exact row gap from 'carnet'
      const bigPhotoRowHeight = selectedTemplate.pageHeight - (paddingY * 2) - (selectedTemplate.photoHeight * 2) - (gapY * 2);

      return `
        display: grid !important;
        grid-template-columns: ${selectedTemplate.photoWidth}mm ${selectedTemplate.photoWidth}mm !important;
        grid-template-rows: ${selectedTemplate.photoHeight}mm ${selectedTemplate.photoHeight}mm ${bigPhotoRowHeight}mm !important;
        padding: ${paddingY}mm ${paddingX}mm !important;
        column-gap: ${gapX}mm !important;
        row-gap: ${gapY}mm !important;
        justify-content: start !important;
        align-content: start !important;
        box-sizing: border-box !important;
      `;
    }

    if (selectedTemplate.id === 'carnet') {
      const remainingWidth = selectedTemplate.pageWidth - (selectedTemplate.cols * selectedTemplate.photoWidth);
      const paddingX = remainingWidth / (2 * selectedTemplate.cols);
      const gapX = paddingX * 2;

      const remainingHeight = selectedTemplate.pageHeight - (selectedTemplate.rows * selectedTemplate.photoHeight);
      const paddingY = remainingHeight / (2 * selectedTemplate.rows);
      const gapY = paddingY * 2;

      return `
        display: grid !important;
        grid-template-columns: repeat(${selectedTemplate.cols}, ${selectedTemplate.photoWidth}mm) !important;
        grid-template-rows: repeat(${selectedTemplate.rows}, ${selectedTemplate.photoHeight}mm) !important;
        padding: ${paddingY}mm ${paddingX}mm !important;
        column-gap: ${gapX}mm !important;
        row-gap: ${gapY}mm !important;
        justify-content: start !important;
        align-content: start !important;
        box-sizing: border-box !important;
      `;
    }

    return `
      display: grid !important;
      grid-template-columns: repeat(${selectedTemplate.cols}, ${selectedTemplate.photoWidth}mm) !important;
      grid-template-rows: repeat(${selectedTemplate.rows}, ${selectedTemplate.photoHeight}mm) !important;
      justify-content: space-evenly !important;
      align-content: space-evenly !important;
      gap: 0 !important;
      box-sizing: border-box !important;
    `;
  };

  const getPreviewGridStyles = (): React.CSSProperties => {
    const multiplier = 3.78;

    if (selectedTemplate.layoutType === 'hybrid-carnet-plus') {
      const paddingX = 6.25;
      const gapX = 12.5;
      const paddingY = 3.5625;
      const gapY = 7.125;
      const bigPhotoRowHeight = selectedTemplate.pageHeight - (paddingY * 2) - (selectedTemplate.photoHeight * 2) - (gapY * 2);

      return {
        display: 'grid',
        gridTemplateColumns: `${selectedTemplate.photoWidth * multiplier}px ${selectedTemplate.photoWidth * multiplier}px`,
        gridTemplateRows: `${selectedTemplate.photoHeight * multiplier}px ${selectedTemplate.photoHeight * multiplier}px ${bigPhotoRowHeight * multiplier}px`,
        padding: `${paddingY * multiplier}px ${paddingX * multiplier}px`,
        columnGap: `${gapX * multiplier}px`,
        rowGap: `${gapY * multiplier}px`,
        justifyContent: 'start',
        alignContent: 'start',
      };
    }

    if (selectedTemplate.id === 'carnet') {
      const remainingWidth = selectedTemplate.pageWidth - (selectedTemplate.cols * selectedTemplate.photoWidth);
      const paddingX = remainingWidth / (2 * selectedTemplate.cols);
      const gapX = paddingX * 2;
      const remainingHeight = selectedTemplate.pageHeight - (selectedTemplate.rows * selectedTemplate.photoHeight);
      const paddingY = remainingHeight / (2 * selectedTemplate.rows);
      const gapY = paddingY * 2;

      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${selectedTemplate.cols}, ${selectedTemplate.photoWidth * multiplier}px)`,
        gridTemplateRows: `repeat(${selectedTemplate.rows}, ${selectedTemplate.photoHeight * multiplier}px)`,
        padding: `${paddingY * multiplier}px ${paddingX * multiplier}px`,
        columnGap: `${gapX * multiplier}px`,
        rowGap: `${gapY * multiplier}px`,
        justifyContent: 'start',
        alignContent: 'start',
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${selectedTemplate.cols}, ${selectedTemplate.photoWidth * multiplier}px)`,
      gridTemplateRows: `repeat(${selectedTemplate.rows}, ${selectedTemplate.photoHeight * multiplier}px)`,
      justifyContent: 'space-evenly',
      alignContent: 'space-evenly',
    };
  };

  const printStyles = `
    @media print {
      @page {
        size: ${selectedTemplate.pageWidth}mm ${selectedTemplate.pageHeight}mm;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page {
        width: ${selectedTemplate.pageWidth}mm !important;
        height: ${selectedTemplate.pageHeight}mm !important;
        ${getPrintGridCSS()}
        page-break-after: always;
        break-after: page;
        overflow: hidden !important;
        position: relative !important;
        background: white !important;
      }
      .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      .print-photo-container {
        width: ${selectedTemplate.photoWidth}mm !important;
        height: ${selectedTemplate.photoHeight}mm !important;
        page-break-inside: avoid;
        box-sizing: border-box !important;
        position: relative !important;
        overflow: hidden !important;
      }
    }
  `;

  return {
    templates,
    selectedTemplate,
    photos,
    galleryPhotos: galleryPhotos.filter(p => showAllPhotos || !templateId || p.templateId === templateId),
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
  };
};
