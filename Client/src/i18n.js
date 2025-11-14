// i18n.js
// Place this file in your React src/ directory

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import rwTranslation from './locales/rw/translation.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      fr: {
        translation: frTranslation
      },
      rw: {
        translation: rwTranslation
      }
    },
    fallbackLng: 'en',
    debug: false, // Set to true for debugging
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      // Order of detection methods
      order: ['localStorage', 'cookie', 'navigator'],
      // Cache user language on
      caches: ['localStorage', 'cookie'],
      // Cookie options
      cookieMinutes: 525600, // 1 year
      cookieDomain: 'localhost', // Change this for production
    }
  });

export default i18n;