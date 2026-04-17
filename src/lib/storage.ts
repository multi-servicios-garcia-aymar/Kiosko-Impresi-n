import { get, set, del, keys } from 'idb-keyval';

export interface SavedPhoto {
  id: string;
  base64?: string;
  blob?: Blob; // Para compatibilidad con versiones de fotos anteriores
  timestamp: number;
}

export interface GalleryPhoto extends SavedPhoto {
  url: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const savePhotoToGallery = async (photoUrl: string): Promise<GalleryPhoto> => {
  const id = Date.now().toString();
  const timestamp = Date.now();
  let responseBlob: Blob;

  if (photoUrl.startsWith('data:')) {
    const res = await fetch(photoUrl);
    responseBlob = await res.blob();
  } else {
    const response = await fetch(photoUrl);
    responseBlob = await response.blob();
  }

  // WEB (Base64 into IndexedDB)
  const base64 = await blobToBase64(responseBlob);
  const newPhoto: SavedPhoto = { id, base64, timestamp };
  await set(`photo_${id}`, newPhoto);
  
  return { ...newPhoto, url: base64 };
};

export const getSavedPhotos = async (): Promise<GalleryPhoto[]> => {
  const allKeys = await keys();
  const photoKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('photo_'));
  const photos = await Promise.all(photoKeys.map(k => get<SavedPhoto>(k as string)));
  
  const validPhotos: GalleryPhoto[] = [];

  for (const p of photos) {
    if (!p) continue;
    
    let url = '';
    
    if (p.base64) {
      url = p.base64;
    } else if (p.blob) {
      url = URL.createObjectURL(p.blob);
    }

    if (url) {
      validPhotos.push({ ...p, url });
    }
  }

  return validPhotos.sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteSavedPhoto = async (id: string): Promise<void> => {
  await del(`photo_${id}`);
};
