import React from 'react';

interface LanguageFlagsProps {
  languages: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageFlags: React.FC<LanguageFlagsProps> = ({ 
  languages, 
  size = 'sm', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-8 h-6'
  };

  const getFlag = (language: string) => {
    switch (language.toLowerCase()) {
      case 'en':
      case 'english':
        return {
          flag: '🇬🇧',
          alt: 'English',
          title: 'English'
        };
      case 'de':
      case 'german':
        return {
          flag: '🇩🇪',
          alt: 'German', 
          title: 'German'
        };
      default:
        return {
          flag: '🌐',
          alt: language,
          title: language
        };
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {languages.map((language, index) => {
        const { flag, alt, title } = getFlag(language);
        return (
          <span
            key={index}
            className={`inline-flex items-center justify-center ${sizeClasses[size]} text-xs`}
            title={title}
            aria-label={alt}
          >
            {flag}
          </span>
        );
      })}
    </div>
  );
};