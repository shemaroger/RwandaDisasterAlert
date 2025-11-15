// components/LanguageSwitcher.jsx
// Updated with better styling and backend synchronization

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import apiService from '../services/api';

const LanguageSwitcher = ({ 
  variant = 'default', // 'default', 'compact', 'mobile'
  showLabel = true 
}) => {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', nativeName: 'Ikinyarwanda' }
  ];

  // Initialize language from localStorage or user preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 
                         localStorage.getItem('preferred_language') || 
                         'en';
    
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage).catch(err => {
        console.error('Failed to initialize language:', err);
      });
    }
  }, [i18n]);

  const changeLanguage = async (languageCode) => {
    if (i18n.language === languageCode) {
      return; // Already in this language
    }

    setIsChanging(true);
    setError(null);
    
    try {
      // Change language in React
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage
      localStorage.setItem('language', languageCode);
      localStorage.setItem('preferred_language', languageCode);
      
      // Sync with Django backend if user is authenticated
      if (apiService.isAuthenticated()) {
        await syncLanguageWithBackend(languageCode);
      }
      
      console.log(`✅ Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      setError('Failed to change language');
      
      // Revert to previous language
      const previousLang = localStorage.getItem('language') || 'en';
      await i18n.changeLanguage(previousLang);
    } finally {
      setIsChanging(false);
    }
  };

  const syncLanguageWithBackend = async (language) => {
    try {
      // Update user profile with new language preference
      await apiService.updateProfile({ preferred_language: language });
      console.log('✅ Backend language sync successful');
    } catch (error) {
      console.warn('⚠️ Failed to sync language with backend:', error);
      // Don't throw error - frontend language change should still work
    }
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  // Variant styles
  const getSelectStyles = () => {
    const baseStyles = "appearance-none border rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500";
    
    switch (variant) {
      case 'compact':
        return `${baseStyles} bg-slate-50 border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-100`;
      case 'mobile':
        return `${baseStyles} bg-white border-slate-300 w-full px-3 py-2 text-sm hover:bg-slate-50`;
      default:
        return `${baseStyles} bg-slate-50 border-slate-300 px-3 py-2 text-sm hover:bg-slate-100`;
    }
  };

  const currentLang = getCurrentLanguage();

  if (variant === 'mobile') {
    return (
      <div className="language-switcher-mobile w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600 flex items-center">
            <Globe className="h-3 w-3 mr-1" />
            {t('language') || 'Language'}:
          </label>
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
        </div>
        <select
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          disabled={isChanging}
          className={getSelectStyles()}
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.nativeName}
            </option>
          ))}
        </select>
        {isChanging && (
          <div className="text-xs text-slate-500 mt-1 flex items-center">
            <span className="animate-pulse">Changing language...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`language-switcher ${variant === 'compact' ? 'language-switcher-compact' : ''}`}>
      <div className="relative inline-block">
        {showLabel && variant !== 'compact' && (
          <label 
            htmlFor="language-select" 
            className="text-xs font-medium text-slate-600 mr-2 hidden sm:inline-block"
          >
            {t('language')}:
          </label>
        )}
        <div className="relative inline-block">
          <select
            id="language-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            disabled={isChanging}
            className={`${getSelectStyles()} pr-8`}
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {variant === 'compact' 
                  ? lang.code.toUpperCase() 
                  : `${lang.flag} ${lang.code.toUpperCase()}`
                }
              </option>
            ))}
          </select>
          <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>
        {isChanging && (
          <span className="ml-2 text-xs text-slate-500 animate-pulse">...</span>
        )}
        {error && (
          <span className="ml-2 text-xs text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;