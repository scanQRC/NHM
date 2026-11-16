import React, {useState} from 'react';
import {FileImage} from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#102B50] via-[#163765] to-[#1769D2] text-white p-6 text-center ${className}`}
      >
        <FileImage className="w-8 h-8 text-[#12A66A] mb-2 opacity-90" strokeWidth={1.75} />
        <span className="text-xs font-medium tracking-wide text-slate-200 max-w-[20ch]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
