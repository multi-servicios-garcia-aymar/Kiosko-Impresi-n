import React, { useState, useEffect } from 'react';
import { LicenseService } from '../services/licenseService';
import { ActivationScreen } from './ActivationScreen';
import { Loader2 } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const { license, refreshLicense, isLoading: isContextLoading, trialStatus } = useLicense();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await refreshLicense();
      setIsChecking(false);
    };
    init();

    // Periodic check every 30 minutes
    const interval = setInterval(() => {
      refreshLicense();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleActivated = async () => {
    setIsChecking(true);
    await refreshLicense();
    setIsChecking(false);
  };

  if (isChecking || isContextLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Verificando estado del equipo...</p>
      </div>
    );
  }

  // Allow access if license is valid OR trial is active
  if (!license && (!trialStatus || !trialStatus.isTrialActive)) {
    return <ActivationScreen onActivated={handleActivated} />;
  }

  return <>{children}</>;
};
