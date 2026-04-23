import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../services/LoggerService';

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPhotos: 0,
    dbHealth: 'Óptimo',
    activeToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ count: userCount }, { count: photoCount }, { count: activeCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('kiosk_gallery_photos').select('*', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);

      setStats({
        totalUsers: userCount || 0,
        totalPhotos: photoCount || 0,
        dbHealth: 'Óptimo',
        activeToday: activeCount || 0
      });
      
      logger.info('Admin stats refreshed');
    } catch (e) {
      logger.error('Error fetching admin stats', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}
