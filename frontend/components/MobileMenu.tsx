'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const links = [
        { href: '/about', label: 'About' },
        { href: '/category/backend', label: 'Backend' },
        { href: '/category/devops', label: 'Devops' },
        { href: '/category/iot', label: 'IoT' },
        { href: '/category/ai', label: 'AI' },
        { href: '/archives', label: 'Archives' },
        { href: '/categories', label: 'Categories' },
        { href: '/tags', label: 'Tags' },
    ];

    return (
        <div className="md:hidden">
            <button 
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
                aria-label="Open Menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 z-[99] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div 
                className={`fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white dark:bg-[#181818] z-[100] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#222]">
                        <span className="font-bold text-lg dark:text-white uppercase tracking-wider">Menu</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-4">
                            {links.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href}
                                        className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                                            pathname === link.href 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-[#222]">
                        <div className="text-xs text-center text-gray-500">
                             GET TIPS 200 OK
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
