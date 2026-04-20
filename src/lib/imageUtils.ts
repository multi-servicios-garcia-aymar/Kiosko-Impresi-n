export const compressImage = async (file: File, maxWidth = 1500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to WebP to preserve transparency if it exists
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180;
};

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: any,
  rotation: number,
  bgColor: string,
  bgImgSrc?: string
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const rotRad = getRadianAngle(rotation);
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return '';
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // 1. Draw solid background color
  if (bgColor !== 'transparent') {
    croppedCtx.fillStyle = bgColor;
    croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
  }

  // 2. Draw background image (cover aspect ratio)
  if (bgImgSrc) {
    try {
      const bgImg = await createImage(bgImgSrc);
      const bgRatio = bgImg.width / bgImg.height;
      const canvasRatio = croppedCanvas.width / croppedCanvas.height;
      
      let drawWidth = croppedCanvas.width;
      let drawHeight = croppedCanvas.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (bgRatio > canvasRatio) {
        drawHeight = croppedCanvas.height;
        drawWidth = drawHeight * bgRatio;
        offsetX = (croppedCanvas.width - drawWidth) / 2;
      } else {
        drawWidth = croppedCanvas.width;
        drawHeight = drawWidth / bgRatio;
        offsetY = (croppedCanvas.height - drawHeight) / 2;
      }
      
      croppedCtx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
    } catch(e) {
      console.error("Failed to load background image", e);
    }
  }

  // 3. Draw the user's cropped foreground image
  const { x, y, width, height } = pixelCrop;
  croppedCtx.drawImage(
    canvas,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) return;
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
};
