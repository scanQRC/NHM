import React from 'react';

export const NMH_LOGO_SRC = '/assets/aistudio/image_12173a4f.png';

interface NMHLogoProps {
  variant?: 'default' | 'on-dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NMHLogo: React.FC<NMHLogoProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const heightClass =
    size === 'sm'
      ? 'h-8 sm:h-9'
      : size === 'lg'
        ? 'h-12 sm:h-14'
        : 'h-10 sm:h-11';

  const imgElement = (
    <img
      src={NMH_LOGO_SRC}
      alt="National Medical Hall (NMH) Logo"
      referrerPolicy="no-referrer"
      className={`${heightClass} w-auto max-w-full object-contain block select-none`}
    />
  );

  if (variant === 'on-dark') {
    return (
      <div
        className={`inline-flex items-center bg-white rounded-lg px-3 py-1.5 shadow-xs shrink-0 ${className}`}
      >
        {imgElement}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      {imgElement}
    </div>
  );
};
