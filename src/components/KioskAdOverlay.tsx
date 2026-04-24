import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, X, Megaphone, Volume2, VolumeX } from 'lucide-react';
import { useAdStore } from '../store/useAdStore';
import { useAdTargeting } from '../hooks/useAdTargeting';

export const KioskAdOverlay: React.FC = () => {
  const [activeAd, setActiveAd] = useState<any>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Filter possible overlay ads
  const overlayAds = useAdTargeting({ placement: 'overlay' });

  const mediaItems = useMemo(() => {
    if (activeAd?.media_items && activeAd.media_items.length > 0) {
      return activeAd.media_items;
    }
    return activeAd ? [{ url: activeAd.image_url, type: 'image' }] : [];
  }, [activeAd]);

  const activeMedia = mediaItems[activeMediaIndex];

  useEffect(() => {
    if (overlayAds.length === 0 || hasShownThisSession) return;

    // Show after a delay (e.g., 15 seconds of interaction)
    const timer = setTimeout(() => {
      setActiveAd(overlayAds[0]);
      setHasShownThisSession(true);
    }, 15000); 

    return () => clearTimeout(timer);
  }, [overlayAds, hasShownThisSession]);

  // Cycle through media items if multiple exist
  useEffect(() => {
    if (!activeAd || mediaItems.length <= 1) return;

    const duration = activeMedia?.duration || activeAd.display_duration || 5000;
    const timer = setTimeout(() => {
      setActiveMediaIndex(prev => (prev + 1) % mediaItems.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeAd, activeMediaIndex, mediaItems, activeMedia]);

  if (!activeAd) return null;

  return (
    <AnimatePresence>
      {activeAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveAd(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl shadow-slate-900/20 overflow-hidden relative"
          >
            <div className="aspect-[4/5] relative bg-slate-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMediaIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  {activeMedia?.type === 'video' ? (
                    <div className="w-full h-full relative">
                      <video
                        src={activeMedia.url}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="absolute bottom-24 right-6 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white z-20"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <img 
                      src={activeMedia?.url || activeAd.image_url} 
                      alt={activeAd.title}
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-20" />
              
              <button 
                onClick={() => setActiveAd(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-30"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-[9px] font-black uppercase tracking-widest z-30 border border-white/20">
                ADS
              </div>

              <div className="absolute bottom-10 left-8 right-8 text-left z-30">
                <h3 className="text-2xl font-black text-white mb-2 leading-tight drop-shadow-2xl uppercase tracking-tight">
                  {activeAd.title}
                </h3>
                {activeAd.description && (
                  <p className="text-white/90 text-xs font-semibold mb-6 line-clamp-3 drop-shadow-lg max-w-md">
                    {activeAd.description}
                  </p>
                )}

                {activeAd.cta_text && (
                  <a
                    href={activeAd.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl"
                  >
                    {activeAd.cta_text}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
