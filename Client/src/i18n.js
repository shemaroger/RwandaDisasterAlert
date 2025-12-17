// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import rwTranslation from './locales/rw/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      rw: { translation: rwTranslation }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 525600, // 1 year
      cookieDomain: window.location.hostname === 'localhost' ? 'localhost' : '.yourdomain.com'
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindStore: 'added removed',
      nsMode: 'default'
    }
  });

// Set HTML lang attribute and dispatch custom event
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lng } }));
});

export default i18n;