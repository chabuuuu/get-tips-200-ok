"use client";

import React, { useState } from 'react';
import { Settings, Moon, Sun, Minus, Plus, Type } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function FloatingSettings() {
  const { theme, toggleTheme, fontSize, setFontSize } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const changeFontSize = (delta: number) => {
    const newSize = Math.min(Math.max(fontSize + delta, 12), 24);
    setFontSize(newSize);
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end space-y-4">
      {/* Menu Options */}
      {isOpen && (
        <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-[#333] mb-4 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200">
            
            {/* Theme Toggle */}
            <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Theme</h4>
                <button 
                    onClick={toggleTheme}
                    className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition"
                >
                    <span className="text-sm font-medium dark:text-gray-200">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    {theme === 'dark' ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-yellow-500" />}
                </button>
            </div>

            {/* Font Size Toggle */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Font Size</h4>
                <div className="flex items-center justify-between bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg">
                    <button 
                        onClick={() => changeFontSize(-1)}
                        className="p-2 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm transition"
                    >
                        <Minus size={14} className="dark:text-gray-200" />
                    </button>
                    <span className="text-sm font-bold w-8 text-center dark:text-gray-200">{fontSize}</span>
                    <button 
                         onClick={() => changeFontSize(1)}
                         className="p-2 hover:bg-white dark:hover:bg-[#333] rounded shadow-sm transition"
                    >
                        <Plus size={14} className="dark:text-gray-200" />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none ${isOpen ? 'bg-blue-600 rotate-90' : 'bg-[#1a1a1a] dark:bg-blue-600'} text-white border-2 border-transparent hover:border-blue-400`}
      >
        <Settings size={24} />
      </button>
    </div>
  );
}
