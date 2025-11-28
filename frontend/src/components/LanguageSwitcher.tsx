import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'sv' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      className="lang-switcher" 
      onClick={toggleLanguage}
      aria-label="Switch language"
    >
      {i18n.language === 'en' ? 'Svenska' : 'English'}
    </button>
  );
};

export default LanguageSwitcher;
