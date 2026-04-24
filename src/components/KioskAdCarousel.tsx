import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { useAdStore } from '../store/useAdStore';
import { useLicense } from '../context/LicenseContext';
import { useAdTargeting } from '../hooks/useAdTargeting';

export const KioskAdCarousel: React.FC = () => {
  const { fetchAds, initializeAdSync } = useAdStore();
  const { license } = useLicense();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const machineId = license?.hardwareId || 'global';
    fetchAds(machineId);
    initializeAdSync(machineId);
  }, [fetchAds, initializeAdSync, license]);

  const filteredAds = useAdTargeting({ placement: 'carousel' });

  useEffect(() => {
    if (currentIndex >= filteredAds.length && filteredAds.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredAds, currentIndex]);

  const activeAd = filteredAds[currentIndex];
  const mediaItems = useMemo(() => {
    if (activeAd?.media_items && activeAd.media_items.length > 0) {
      return activeAd.media_items;
    }
    // Fallback if no media_items but has image_url
    return [{ url: activeAd?.image_url, type: 'image' }] as any[];
  }, [activeAd]);

  const activeMedia = mediaItems[activeMediaIndex];

  useEffect(() => {
    if (filteredAds.length === 0) return;

    const duration = activeMedia?.duration || activeAd?.display_duration || 5000;

    const timer = setTimeout(() => {
      if (mediaItems.length > 1 && activeMediaIndex < mediaItems.length - 1) {
        setActiveMediaIndex(prev => prev + 1);
      } else {
        setActiveMediaIndex(0);
        setCurrentIndex((prev) => (prev + 1) % filteredAds.length);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [filteredAds, currentIndex, activeMediaIndex, mediaItems, activeMedia, activeAd]);

  // Reset internal media index when changing main ad
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [currentIndex]);

  if (filteredAds.length === 0) return null;

  const getVariants = (mode: string) => {
    switch (mode) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -100 }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.2 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getVariants(activeAd?.display_mode || 'fade');

  return (
    <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-12 relative bg-transparent group">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeAd?.id}-${activeMediaIndex}`}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {activeMedia?.type === 'video' ? (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
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
                className="absolute top-4 left-4 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all z-20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <img
              src={activeMedia?.url || activeAd?.image_url}
              alt={activeAd?.title}
              className="w-full h-full object-contain"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-80" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-500/20">
                  Publicidad Premium
                </div>
                <div className="h-px w-8 bg-white/20" />
              </div>
              
              <h3 className="text-white font-black text-2xl md:text-4xl tracking-tight leading-[1.1] mb-2 drop-shadow-2xl">
                {activeAd?.title}
              </h3>
              
              {activeAd?.description && (
                <p className="text-white/70 text-sm md:text-base font-medium line-clamp-2 max-w-2xl drop-shadow-md">
                  {activeAd.description}
                </p>
              )}
            </div>
            
            {activeAd?.cta_text && activeAd?.cta_url && (
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href={activeAd.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-2xl hover:bg-indigo-50 transition-all border border-white/50 flex items-center gap-2"
              >
                {activeAd.cta_text}
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Progress indicators */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        {filteredAds.map((ad, idx) => (
          <div key={idx} className="flex gap-0.5">
            {idx === currentIndex && mediaItems.length > 1 ? (
              mediaItems.map((_, mIdx) => (
                <div
                  key={mIdx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    mIdx === activeMediaIndex ? 'w-4 bg-indigo-50' : 'w-1 bg-white/30'
                  }`}
                />
              ))
            ) : (
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-indigo-50' : 'w-2 bg-white/50'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
