"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'vi' | 'ja';

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  availableLocales: { code: Locale; label: string; flag: string }[];
}

const AVAILABLE_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
];

const LanguageContext = createContext<LanguageContextType>({
  locale: 'vi',
  setLocale: () => {},
  availableLocales: AVAILABLE_LOCALES,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    // 1. Check local storage
    const saved = localStorage.getItem('blog_locale') as Locale;
    if (saved && (saved === 'vi' || saved === 'ja')) {
      setLocaleState(saved);
      return;
    }

    // 2. Check browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) {
        setLocaleState('ja');
        localStorage.setItem('blog_locale', 'ja');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('blog_locale', newLocale);
    // Set cookie for SSR reading
    document.cookie = `blog_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        availableLocales: AVAILABLE_LOCALES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
