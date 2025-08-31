// Enhanced i18n setup with RTL support and University Assist configuration

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/i18n/en.json';
import arCommon from '@/i18n/ar.json';
import deCommon from '@/i18n/de.json';

const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
  de: { common: deCommon },
};

// RTL languages
export const RTL_LANGUAGES = ['ar'];

// Language display names
export const LANGUAGE_NAMES = {
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Force English only
    debug: false,
    
    // Language detection configuration - disabled to keep English only
    detection: {
      order: [], // Disable detection
      caches: [] // Don't cache language preference
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    defaultNS: 'common',
    ns: ['common']
  });

// Set document direction - always LTR for English only
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
});

// Initialize direction on load - force English
document.documentElement.dir = 'ltr';
document.documentElement.lang = 'en';

export default i18n;