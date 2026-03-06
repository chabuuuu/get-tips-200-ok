'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchInput() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Sync input with URL param
    useEffect(() => {
        const query = searchParams.get('search');
        if (query) {
            setSearchTerm(query);
            setIsOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/?search=${encodeURIComponent(searchTerm)}`);
        } else {
            router.push('/');
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.push('/');
        setIsOpen(false);
    };

    const toggleSearch = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
             // opening
        } else {
            // closing, maybe clear if empty?
            if (!searchTerm) setIsOpen(false);
        }
    };

    return (
        <div className="relative flex items-center">
             <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'w-32 sm:w-48 md:w-64 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
                <form onSubmit={handleSearch} className="w-full relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search posts..."
                        className="w-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm rounded-full py-1 px-4 pr-8 focus:outline-none border border-transparent focus:border-blue-500 transition-colors"
                        onBlur={() => {
                            if (!searchTerm) setIsOpen(false);
                        }}
                    />
                    {searchTerm && (
                        <button 
                            type="button" 
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </form>
             </div>

             <button 
                onClick={toggleSearch} 
                className={`hover:text-white transition ${isOpen ? 'text-blue-500' : ''}`}
                aria-label="Toggle Search"
            >
                <Search size={18} />
             </button>
        </div>
    );
}
