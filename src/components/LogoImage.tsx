import React, { useState } from 'react';
import { Headphones } from 'lucide-react';

interface LogoImageProps {
  className?: string;
  alt?: string;
}

const PRIMARY_LOGO = "https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/icon-192.png";
const FALLBACK_LOGO = "https://vqgnxqabvmmpfoiceass.supabase.co/storage/v1/object/public/app-assets/apple-touch-icon.png";

export const LogoImage: React.FC<LogoImageProps> = ({ 
  className = "w-9 h-9 rounded-xl border-2 border-black object-cover neo-shadow-xs",
  alt = "SimuliziMix Logo"
}) => {
  const [imgSrc, setImgSrc] = useState<string>(PRIMARY_LOGO);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (imgSrc === PRIMARY_LOGO) {
      setImgSrc(FALLBACK_LOGO);
    } else if (imgSrc === FALLBACK_LOGO) {
      setImgSrc("/icon-192.png");
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
