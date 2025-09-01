import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enCommon from '@/i18n/en.json';
import arCommon from '@/i18n/ar.json';
import deCommon from '@/i18n/de.json';

const resources = {
  en: {
    common: enCommon,
  },
  ar: {
    common: arCommon,
  },
  de: {
    common: deCommon,
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Default namespace
    defaultNS: 'common',
    
    // Load namespaces
    ns: ['common'],
  });

export default i18n;