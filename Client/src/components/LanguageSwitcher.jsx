// LanguageSwitcher.jsx
// Place this in your React components directory

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css'; // Optional: Create this for styling

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ];

  const changeLanguage = async (languageCode) => {
    setIsChanging(true);
    
    try {
      // Change language in React
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage
      localStorage.setItem('language', languageCode);
      
      // Sync with Django backend
      await syncLanguageWithBackend(languageCode);
      
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Error changing language:', error);
      alert('Failed to change language. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const syncLanguageWithBackend = async (language) => {
    try {
      const response = await fetch('http://localhost:8000/api/language/set/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
        credentials: 'include' // Include cookies for session
      });

      if (!response.ok) {
        throw new Error('Failed to sync language with backend');
      }

      const data = await response.json();
      console.log('Backend sync successful:', data);
    } catch (error) {
      console.error('Error syncing with backend:', error);
      // Don't throw error - frontend language change should still work
    }
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="language-label">
        {t('language')}:
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        disabled={isChanging}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      {isChanging && <span className="changing-indicator">...</span>}
    </div>
  );
};

export default LanguageSwitcher;