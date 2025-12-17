// src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [languageKey, setLanguageKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };

    // Listen to i18n language changes
    i18n.on('languageChanged', handleLanguageChange);

    // Listen to custom event
    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem('language', languageCode);
      localStorage.setItem('preferred_language', languageCode);
      console.log(`✅ Language changed to: ${languageCode}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to change language:', error);
      return false;
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      languageKey, 
      changeLanguage, 
      currentLanguage: i18n.language 
    }}>
      <div key={languageKey}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};