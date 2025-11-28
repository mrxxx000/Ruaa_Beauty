import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const getLanguageLabel = (lang: string) => {
    switch(lang) {
      case 'en': return '🇬🇧 English';
      case 'sv': return '🇸🇪 Svenska';
      case 'ar': return '🇸🇦 العربية';
      default: return lang;
    }
  };

  return (
    <select 
      className="lang-switcher-dropdown" 
      value={i18n.language}
      onChange={handleLanguageChange}
      aria-label="Select language"
    >
      <option value="en">English</option>
      <option value="sv">Svenska</option>
      <option value="ar">العربية</option>
    </select>
  );
};

export default LanguageSwitcher;
