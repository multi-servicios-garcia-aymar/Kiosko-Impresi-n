import React, { createContext, useContext, useState, useEffect } from 'react';
import { LicenseData, LicenseService } from '../services/licenseService';
import { logger } from '../services/loggerService';
import { useAuthStore } from '../store/useAuthStore';

interface LicenseContextType {
  license: LicenseData | null;
  setLicense: (license: LicenseData | null) => void;
  isLoading: boolean;
  refreshLicense: () => Promise<void>;
  trialStatus: { isTrialActive: boolean; daysRemaining: number } | null;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [trialStatus, setTrialStatus] = useState<{ isTrialActive: boolean; daysRemaining: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use Zustand safely inside React context
  const user = useAuthStore((state) => state.user);

  const refreshLicense = async () => {
    try {
      let syncAttempted = false;

      // 1. Magic Link / QR Code Check
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync');
      if (syncParam) {
        try {
          const decoded = JSON.parse(atob(syncParam));
          if (decoded.key && decoded.hwid) {
            localStorage.setItem('nexo_kiosk_machine_id', decoded.hwid);
            await LicenseService.activateLicense(decoded.key);
            syncAttempted = true;
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
          }
        } catch(e) {
           console.error('Failed to parse magic link', e);
        }
      }

      // 2. Cloud Backup Sync Check (if no magic link used)
      if (!syncAttempted && user?.user_metadata?.kiosk_license) {
        const localCheck = await LicenseService.checkLocalLicense();
        // If we don't have a valid license locally, but we have a cloud backup, pull it down
        if (!localCheck.isValid) {
          const { key, hwid } = user.user_metadata.kiosk_license;
          if (key && hwid) {
            localStorage.setItem('nexo_kiosk_machine_id', hwid);
            await LicenseService.activateLicense(key);
            syncAttempted = true;
          }
        }
      }

      // 3. Normal local load
      const { isValid, data } = await LicenseService.checkLocalLicense();
      if (isValid && data) {
        setLicense(data);
      } else {
        setLicense(null);
        // If no license, check trial status
        const status = await LicenseService.checkTrialStatus();
        setTrialStatus(status);
      }
    } catch (error) {
      logger.error('Error refreshing license:', error);
      setLicense(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLicense();
    // Re-run if user object changes (e.g., they logged in and now we have access to metadata)
    // We intentionally don't put user in dependency array to avoid infinite loops,
    // but the AuthGuard already ensures this tree mounts *after* user is loaded.
  }, [user?.id]);

  return (
    <LicenseContext.Provider value={{ license, setLicense, isLoading, refreshLicense, trialStatus }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
