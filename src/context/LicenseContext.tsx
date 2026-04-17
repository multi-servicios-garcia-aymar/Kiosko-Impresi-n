import React, { createContext, useContext, useState, useEffect } from 'react';
import { LicenseData, LicenseService } from '../services/licenseService';
import { logger } from '../services/loggerService';

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

  const refreshLicense = async () => {
    try {
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
  }, []);

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
