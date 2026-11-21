import { createContext, useContext, useState } from 'react';
import { STRINGS } from '../data/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('gwm_language') || 'en');

  function changeLanguage(lang) {
    setLanguage(lang);
    localStorage.setItem('gwm_language', lang);
  }

  // t(key, fallback) looks up the string for the current language, falling
  // back to English, then to the key itself (never crashes on a missing key,
  // which matters a lot with a dictionary this size).
  function t(key, fallback) {
    return STRINGS[language]?.[key] ?? STRINGS.en[key] ?? fallback ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
