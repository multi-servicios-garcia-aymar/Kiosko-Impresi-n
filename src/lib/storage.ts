import { get, set, del, keys } from 'idb-keyval';
import { supabase } from './supabase';

export interface SavedPhoto {
  id: string;
  base64?: string;
  blob?: Blob; // Para compatibilidad con versiones de fotos anteriores
  timestamp: number;
  templateId?: string; // Isolated module ownership
}

export interface GalleryPhoto extends SavedPhoto {
  url: string;
  templateId: string; // Mandatory in gallery view
  cloudPath?: string; // Trazabilidad en la nube
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};

export const savePhotoToGallery = async (photoUrl: string, templateId: string): Promise<GalleryPhoto> => {
  const id = Date.now().toString();
  const timestamp = Date.now();
  let responseBlob: Blob;

  if (photoUrl.startsWith('data:')) {
    responseBlob = await base64ToBlob(photoUrl);
  } else {
    const response = await fetch(photoUrl);
    responseBlob = await response.blob();
  }

  // 1. WEB LOCAL CACHE (Base64 into IndexedDB) - Instant UI Feedback
  const base64 = await blobToBase64(responseBlob);
  const newPhoto: SavedPhoto = { id, base64, timestamp, templateId };
  await set(`photo_${id}`, newPhoto);
  
  let finalUrl = base64;
  let cloudPath = undefined;

  // 2. CLOUD SYNC (If user is authenticated)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    const machineId = user?.user_metadata?.kiosk_license?.hwid;

    if (user && machineId) {
      // Create a unique file name
      const fileName = `${machineId}/${id}.webp`;
      
      // Upload to Supabase Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, responseBlob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (!uploadError && uploadData) {
        cloudPath = uploadData.path;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(uploadData.path);
          
        finalUrl = publicUrl;

        // Broadcast to other devices via Database Table
        // Note: We'll attempt to store template_id if the schema supports it
        await supabase.from('kiosk_gallery_photos').insert({
          id: id, // Force PostgreSQL to use our exact Local Timestamp ID
          machine_id: machineId,
          storage_path: uploadData.path,
          template_id: templateId,
          created_at: new Date(timestamp).toISOString()
        });
      }
    }
  } catch (e) {
    console.error('Cloud upload skipped (operating in offline local mode)', e);
  }
  
  return { ...newPhoto, url: finalUrl, cloudPath, templateId };
};

export const getSavedPhotos = async (): Promise<GalleryPhoto[]> => {
  // 1. Try fetching from the Cloud first if authenticated
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    const machineId = user?.user_metadata?.kiosk_license?.hwid;

    if (user && machineId) {
      const { data: cloudPhotos, error } = await supabase
        .from('kiosk_gallery_photos')
        .select('*')
        .eq('machine_id', machineId)
        .order('created_at', { ascending: false });

      if (!error && cloudPhotos && cloudPhotos.length > 0) {
        return cloudPhotos.map((cp: any) => {
          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(cp.storage_path);
            
          return {
            id: cp.id,
            timestamp: new Date(cp.created_at).getTime(),
            url: publicUrl,
            cloudPath: cp.storage_path,
            templateId: cp.template_id || 'default'
          };
        });
      }
    }
  } catch (e) {
    console.error('Cloud fetch failed, retreating to local storage', e);
  }

  // 2. Offline Fallback (IndexedDB)
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
      validPhotos.push({ ...p, url, templateId: p.templateId || 'default' });
    }
  }

  return validPhotos.sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteSavedPhoto = async (id: string, cloudPath?: string): Promise<void> => {
  // 1. Cloud Deletion (if possible)
  if (cloudPath) {
    try {
      // Remove from table (by original unique machine path or id)
      await supabase.from('kiosk_gallery_photos').delete().eq('storage_path', cloudPath);
      // Remove from bucket
      await supabase.storage.from('gallery').remove([cloudPath]);
    } catch(e) {
      console.error('Failed to remote photo from cloud', e);
    }
  } else {
    // If we weren't passed a cloud path specifically, let's try to find it via the custom ID
    try {
       const { data: { session } } = await supabase.auth.getSession();
       const machineId = session?.user?.user_metadata?.kiosk_license?.hwid;
       if (machineId) {
          // Identify it by id and machine
          const { data } = await supabase.from('kiosk_gallery_photos').select('storage_path').eq('id', id).eq('machine_id', machineId).single();
          if (data && data.storage_path) {
             await supabase.from('kiosk_gallery_photos').delete().eq('storage_path', data.storage_path);
             await supabase.storage.from('gallery').remove([data.storage_path]);
          }
       }
    } catch (e) {
      console.error('Failed fallback cloud deletion', e);
    }
  }

  // 2. Local Deletion
  await del(`photo_${id}`);
};
