import React from 'react';
// Import the local icon from the root using Vite's path resolution
import localIcon from '/icon.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
      <img 
        src={localIcon}
        alt="Logo Oficial" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
