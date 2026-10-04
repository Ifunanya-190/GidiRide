import React from 'react';

export const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; hideText?: boolean }> = ({
  className = '',
  size = 'md',
  hideText = false
}) => {
  const imgSizeMap = {
    sm: 'h-8',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28'
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo-final.png" 
        alt="GidiRide Icon" 
        className={`${imgSizeMap[size]} object-contain`} 
      />
      {!hideText && (
        <span className={`font-black tracking-tighter text-white ${textSizeMap[size]}`}>
          Gidi<span className="text-[#00A859]">Ride</span>
        </span>
      )}
    </div>
  );
};
