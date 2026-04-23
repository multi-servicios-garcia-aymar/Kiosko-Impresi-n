import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { useAdStore } from '../store/useAdStore';
import { useLicense } from '../context/LicenseContext';

export const KioskAdCarousel: React.FC = () => {
  const { ads, fetchAds, initializeAdSync } = useAdStore();
  const { license } = useLicense();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const machineId = license?.id || 'global';
    fetchAds(machineId);
    initializeAdSync(machineId);
  }, [fetchAds, initializeAdSync, license]);

  useEffect(() => {
    if (ads.length <= 1) return;

    const currentAd = ads[currentIndex];
    const duration = currentAd?.display_duration || 5000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [ads, currentIndex]);

  if (ads.length === 0) return null;

  return (
    <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 mb-12 relative bg-slate-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={ads[currentIndex]?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={ads[currentIndex]?.image_url}
            alt={ads[currentIndex]?.title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 -z-10 bg-slate-900/5 backdrop-blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold text-lg md:text-2xl drop-shadow-md mb-1">
                {ads[currentIndex]?.title}
              </h3>
              {ads[currentIndex]?.description && (
                <p className="text-slate-200 text-sm md:text-base line-clamp-2 max-w-xl">
                  {ads[currentIndex].description}
                </p>
              )}
            </div>
            
            {ads[currentIndex]?.cta_text && ads[currentIndex]?.cta_url && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={ads[currentIndex].cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm md:text-base shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-indigo-700 transition-colors"
              >
                {ads[currentIndex].cta_text}
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Progress indicators */}
      {ads.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {ads.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
