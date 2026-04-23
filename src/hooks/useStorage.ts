import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../services/LoggerService';
import { v4 as uuidv4 } from 'uuid';

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (bucket: string, file: File, folder = 'uploads') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      logger.info('Image uploaded successfully', { bucket, fileName, publicUrl });
      return publicUrl;
    } catch (e: any) {
      logger.error('Upload failed', e);
      throw e;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadImage, isUploading };
}
