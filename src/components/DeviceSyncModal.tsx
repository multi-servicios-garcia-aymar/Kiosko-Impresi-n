import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { X, Copy, Smartphone, Cloud, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';

interface DeviceSyncModalProps {
  onClose: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({ onClose }) => {
  const { license } = useLicense();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(!!user?.user_metadata?.kiosk_license);
  
  if (!license) return null;

  // Generate Magic payload
  const payload = btoa(JSON.stringify({ key: license.key, hwid: license.hardwareId }));
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const magicLink = `${baseUrl}?sync=${payload}#/`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCloudSync = async () => {
    if (!user) return;
    setIsSyncingCloud(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          kiosk_license: {
            key: license.key,
            hwid: license.hardwareId
          }
        }
      });
      if (!error) {
        setCloudSynced(true);
      }
    } catch (e) {
      console.error('Cloud sync failed', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">Vincular otro dispositivo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          
          {/* Method 1 & 2: P2P Sync (QR + Magic Link) */}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="shrink-0 p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
              <QRCodeSVG 
                value={magicLink} 
                size={160} 
                bgColor="#ffffff" 
                fgColor="#0f172a" 
                level="Q" 
                includeMargin={false}
              />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mb-1">
                Conexión Local
              </div>
              <h4 className="font-bold text-slate-800 text-lg">Escanea este código</h4>
              <p className="text-sm text-slate-500">
                Apunta con la cámara de tu celular o tablet a este cuadro para abrir la aplicación instantáneamente con tu licencia clonada.
              </p>
              
              <div className="mt-2 flex items-center gap-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">O comparte el enlace</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <button 
                onClick={copyToClipboard}
                className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all flex justify-center items-center gap-2 text-sm ${
                  copied 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Enlace copiado!' : 'Copiar Enlace Mágico'}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Method 3: Cloud Backup */}
          <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Cloud className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-lg">Respaldo en la Nube</h4>
                {cloudSynced && (
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Protegido
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                Guarda tu licencia de forma segura en tu cuenta de correo ({user?.email}). Si formateas tu equipo o abres sesión en otro navegador, tu licencia se recuperará automáticamente.
              </p>
              
              {!cloudSynced ? (
                <button 
                  onClick={handleCloudSync}
                  disabled={isSyncingCloud}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSyncingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  {isSyncingCloud ? 'Sincronizando...' : 'Respaldar mi licencia ahora'}
                </button>
              ) : (
                <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Licencia asegurada en la cuenta actual
                </p>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
