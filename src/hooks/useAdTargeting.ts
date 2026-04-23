import { useMemo } from 'react';
import { useAdStore, KioskAd } from '../store/useAdStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLicense } from '../context/LicenseContext';

export interface AdTargetingOptions {
  placement?: 'carousel' | 'sidebar' | 'overlay';
}

export function useAdTargeting(options: AdTargetingOptions = {}) {
  const { ads } = useAdStore();
  const { user } = useAuthStore();
  const { license } = useLicense();

  const filteredAds = useMemo(() => {
    return ads
      .filter((ad) => {
        if (!ad.is_active) return false;
        
        // Placement filter
        if (options.placement && ad.placement !== options.placement) return false;
        
        // Hardware Targeting
        const machineId = license?.hardwareId || 'global';
        if (ad.target_machine_id && ad.target_machine_id !== machineId) return false;

        // Audience Targeting
        if (ad.target_audience === 'registered' && !user) return false;
        if (ad.target_audience === 'anonymous' && user) return false;
        
        // Trial logic: Logged in but NO active license
        if (ad.target_audience === 'trial') {
          const isTrial = user && !license;
          if (!isTrial) return false;
        }
        
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }, [ads, user, license, options.placement]);

  return filteredAds;
}
