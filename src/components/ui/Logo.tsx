import React from 'react';

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
        src="/icon.svg"
        alt="Foto Estudio App Logo" 
        className="w-full h-full object-contain drop-shadow-md"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
