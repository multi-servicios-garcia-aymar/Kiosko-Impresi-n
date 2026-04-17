import { get, set, del, keys } from 'idb-keyval';

export interface SavedPhoto {
  id: string;
  base64?: string;
  blob?: Blob; // Para compatibilidad con versiones de fotos anteriores
  path?: string; // Para compatibilidad con Tauri File System
  timestamp: number;
}

export interface GalleryPhoto extends SavedPhoto {
  url: string;
}

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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

  // TAURI NATIVE FILE SYSTEM (Enterprise Scale Memory)
  if (isTauri()) {
    try {
      const { writeFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      
      const hasFolder = await exists('photos', { baseDir: BaseDirectory.AppData });
      if (!hasFolder) {
        await mkdir('photos', { baseDir: BaseDirectory.AppData });
      }

      const fileName = `photos/${id}.jpg`;
      const buffer = await responseBlob.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      await writeFile(fileName, uint8Array, { baseDir: BaseDirectory.AppData });

      const newPhoto: SavedPhoto = { id, timestamp, path: fileName };
      await set(`photo_${id}`, newPhoto); // Save METADATA in IndexedDB

      // Get absolute path to display
      const { appDataDir, join } = await import('@tauri-apps/api/path');
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      
      const appDataPath = await appDataDir();
      const absolutePath = await join(appDataPath, fileName);
      const url = convertFileSrc(absolutePath);

      return { ...newPhoto, url };
    } catch (e) {
      console.error("Tauri FS Failed, falling back to IDB", e);
    }
  }

  // WEB FALLBACK (Base64 into IndexedDB)
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
    
    if (p.path && isTauri()) {
      try {
        const { appDataDir, join } = await import('@tauri-apps/api/path');
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const appDataPath = await appDataDir();
        const absolutePath = await join(appDataPath, p.path);
        url = convertFileSrc(absolutePath);
      } catch (e) {
        console.error("Failed to load Tauri path", e);
      }
    } else if (p.base64) {
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
  const meta = await get<SavedPhoto>(`photo_${id}`);
  
  if (meta && meta.path && isTauri()) {
     try {
       const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
       await remove(meta.path, { baseDir: BaseDirectory.AppData });
     } catch (e) {
       console.error("Failed to remove file from Tauri FS", e);
     }
  }

  await del(`photo_${id}`);
};
