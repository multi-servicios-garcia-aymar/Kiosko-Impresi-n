import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/60 to-transparent">
            <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-md">
              {ads[currentIndex]?.title}
            </h3>
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
