import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (containerId: string, fileName: string, pageWidth: number, pageHeight: number) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight]
  });

  const pages = container.querySelectorAll('.print-page');
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;
    
    // We need to temporarily show the hidden print content to capture it
    const originalDisplay = page.style.display;
    page.style.display = 'grid';
    
    const canvas = await html2canvas(page, {
      scale: 3, // Higher scale for better print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    if (i > 0) {
      pdf.addPage([pageWidth, pageHeight], pageWidth > pageHeight ? 'landscape' : 'portrait');
    }
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    
    // Restore display
    page.style.display = originalDisplay;
  }

  pdf.save(`${fileName}.pdf`);
};
