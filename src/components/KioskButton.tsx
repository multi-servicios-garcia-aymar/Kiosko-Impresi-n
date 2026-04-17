import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface KioskButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
  className?: string;
}

export const KioskButton: React.FC<KioskButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  color = 'bg-white',
  className
}) => {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "kiosk-button group",
        color,
        "border border-slate-200 shadow-sm",
        className
      )}
    >
      <div className="mb-4 p-4 rounded-xl bg-slate-50 group-hover:bg-white transition-colors">
        <Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-700" />
      </div>
      <span className="text-sm md:text-base font-semibold text-slate-800 text-center leading-tight">
        {label}
      </span>
    </motion.button>
  );
};
