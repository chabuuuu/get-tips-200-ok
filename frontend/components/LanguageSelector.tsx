"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useLanguage, Locale } from '@/context/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'header' | 'post';
  availableLocales?: string[];
  activeLocale?: string;
  onSelectLocale?: (locale: Locale) => void;
}

export default function LanguageSelector({
  variant = 'header',
  availableLocales = ['vi', 'ja'],
  activeLocale,
  onSelectLocale,
}: LanguageSelectorProps) {
  const { locale, setLocale, availableLocales: allLocales } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = activeLocale || locale;

  const handleSwitch = (newLocale: Locale) => {
    setLocale(newLocale);
    if (onSelectLocale) {
      onSelectLocale(newLocale);
      return;
    }

    // Update URL with ?lang= parameter if on a post or listing page
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('lang', newLocale);
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`${pathname}${query}`);
  };

  if (variant === 'post') {
    return (
      <div className="flex items-center space-x-2 py-2 px-3 bg-gray-100 dark:bg-[#202020] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-xs">
        <span className="flex items-center text-gray-500 dark:text-gray-400 font-medium mr-1">
          <Globe size={13} className="mr-1.5 text-blue-500" />
          Bản dịch:
        </span>
        {allLocales.map((loc) => {
          const isSupported = availableLocales.includes(loc.code);
          const isActive = current === loc.code;

          return (
            <button
              key={loc.code}
              type="button"
              disabled={!isSupported && !isActive}
              onClick={() => handleSwitch(loc.code)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : isSupported
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2a2a2a] cursor-pointer'
                  : 'text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed'
              }`}
              title={
                !isSupported
                  ? `Bài viết chưa có bản dịch ${loc.label}`
                  : `Đọc bằng ${loc.label}`
              }
            >
              <span>{loc.flag}</span>
              <span>{loc.label}</span>
              {!isSupported && (
                <span className="text-[10px] font-normal italic ml-0.5 opacity-80">
                  (Chưa dịch)
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Header variant
  return (
    <div className="flex items-center bg-gray-100 dark:bg-[#1f1f1f] p-0.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-[11px] font-medium">
      {allLocales.map((loc) => {
        const isActive = current === loc.code;
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => handleSwitch(loc.code)}
            className={`px-2 py-1 rounded-md transition-all flex items-center space-x-1 ${
              isActive
                ? 'bg-white dark:bg-[#2a2a2a] text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
            title={`Chuyển sang ${loc.label}`}
          >
            <span>{loc.flag}</span>
            <span className="uppercase">{loc.code}</span>
          </button>
        );
      })}
    </div>
  );
}
