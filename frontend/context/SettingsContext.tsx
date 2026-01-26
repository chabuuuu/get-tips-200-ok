"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark preference
  const [fontSize, setFontSize] = useState(16);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load persisted settings
    const savedTheme = localStorage.getItem('blog-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    
    const savedSize = localStorage.getItem('blog-font-size');
    if (savedSize) setFontSize(parseInt(savedSize, 10));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Apply theme class
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('blog-theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('blog-font-size', fontSize.toString());
  }, [fontSize, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
