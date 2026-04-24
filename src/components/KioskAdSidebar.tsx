import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Film, Volume2, VolumeX } from 'lucide-react';
import { useAdStore } from '../store/useAdStore';
import { useAdTargeting } from '../hooks/useAdTargeting';

export const KioskAdSidebar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Filter ads based on targeting and placement
  const sidebarAds = useAdTargeting({ placement: 'sidebar' });

  useEffect(() => {
    if (currentIndex >= sidebarAds.length && sidebarAds.length > 0) {
      setCurrentIndex(0);
    }
  }, [sidebarAds, currentIndex]);

  const activeAd = sidebarAds[currentIndex];
  const mediaItems = useMemo(() => {
    if (activeAd?.media_items && activeAd.media_items.length > 0) {
      return activeAd.media_items;
    }
    return [{ url: activeAd?.image_url, type: 'image' }] as any[];
  }, [activeAd]);

  const activeMedia = mediaItems[activeMediaIndex];

  useEffect(() => {
    if (sidebarAds.length === 0 || !activeAd) return;

    const duration = activeMedia?.duration || activeAd?.display_duration || 8000;
    const timer = setTimeout(() => {
      if (mediaItems.length > 1 && activeMediaIndex < mediaItems.length - 1) {
        setActiveMediaIndex(prev => prev + 1);
      } else {
        setActiveMediaIndex(0);
        setCurrentIndex((prev) => (prev + 1) % sidebarAds.length);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [sidebarAds, currentIndex, activeMediaIndex, mediaItems, activeMedia, activeAd]);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [currentIndex]);

  if (sidebarAds.length === 0 || !activeAd) return null;

  return (
    <div className="w-full h-full bg-slate-50 border-l border-slate-200 p-4 hidden xl:flex flex-col gap-6 sticky top-0 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publicidad Nexo</h4>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeAd.id}-${activeMediaIndex}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group flex flex-col"
        >
          <div className="aspect-[3/4] relative overflow-hidden">
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
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-2 right-2 p-1.5 bg-black/40 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <img 
                src={activeMedia?.url || activeAd.image_url} 
                alt={activeAd.title}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
              />
            )}
            {/* Gradient removed for floating effect */}
          </div>
          
          <div className="p-5 flex flex-col gap-3">
            <h5 className="font-bold text-slate-800 text-sm">{activeAd.title}</h5>
            {activeAd.description && (
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {activeAd.description}
              </p>
            )}
            
            {activeAd.cta_text && (
              <a
                href={activeAd.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {activeAd.cta_text}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Counter Indicators */}
      <div className="flex justify-center gap-1.5 mt-auto">
        {sidebarAds.map((ad, i) => (
          <div key={i} className="flex gap-0.5">
            {i === currentIndex && mediaItems.length > 1 ? (
              mediaItems.map((_, mIdx) => (
                <div
                  key={mIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${mIdx === activeMediaIndex ? 'w-3 bg-indigo-500' : 'w-1 bg-slate-200'}`}
                />
              ))
            ) : (
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
