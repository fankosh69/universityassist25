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
    debug: false,
    
    // Language detection configuration
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie']
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    defaultNS: 'common',
    ns: ['common']
  });

// Set document direction based on language
i18n.on('languageChanged', (lng) => {
  const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Initialize direction on load
const initialLang = i18n.language || 'en';
const initialDir = RTL_LANGUAGES.includes(initialLang) ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = initialLang;

export default i18n;