import React, { useState } from 'react';
import { Headphones } from 'lucide-react';

interface LogoImageProps {
  className?: string;
  alt?: string;
}

export const LogoImage: React.FC<LogoImageProps> = ({ 
  className = "w-9 h-9 rounded-xl border-2 border-black object-cover neo-shadow-xs",
  alt = "SimuliziMix Logo"
}) => {
  const [imgSrc, setImgSrc] = useState<string>("/logo.png");
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (imgSrc === "/logo.png") {
      setImgSrc("/icon-192.png");
    } else if (imgSrc === "/icon-192.png") {
      setImgSrc("/apple-touch-icon.png");
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`bg-[#CCE4F5] flex items-center justify-center font-black text-black ${className}`}>
        <Headphones className="w-1/2 h-1/2 text-black flex-shrink-0" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      onError={handleError}
      className={className} 
    />
  );
};
