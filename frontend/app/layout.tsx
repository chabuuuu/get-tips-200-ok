import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from 'react';
import "./globals.css";
import Link from "next/link";
import { Github, Facebook, Youtube } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import { SettingsProvider } from "@/context/SettingsContext";
import FloatingSettings from "@/components/FloatingSettings";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GET TIPS 200 OK",
  description: "Blog về tất cả mọi thứ - Backend, DevOps, IoT, AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-[#101010] text-gray-900 dark:text-gray-200 transition-colors duration-300`}>
        <SettingsProvider>
        {/* Header */}
        <header className="bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#222] text-sm transition-colors duration-300">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-gray-900 dark:text-white font-bold tracking-wider text-base uppercase hover:text-blue-500 dark:hover:text-blue-400 transition">
                GET TIPS 200 OK
              </Link>
              
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-6 text-gray-400">
                <Link href="/about" className="hover:text-white transition">About</Link>
                <Link href="/category/backend" className="hover:text-white transition">Backend</Link>
                <Link href="/category/devops" className="hover:text-white transition">Devops</Link>
                <Link href="/category/iot" className="hover:text-white transition">IoT</Link>
                <Link href="/category/ai" className="hover:text-white transition">AI</Link>
                <Link href="/archives" className="hover:text-white transition">Archives</Link>
                <Link href="/categories" className="hover:text-white transition">Categories</Link>
                <Link href="/tags" className="hover:text-white transition">Tags</Link>
              </nav>
            </div>

            {/* Social & Search */}
            <div className="flex items-center space-x-4 text-gray-400">
               <a href="https://github.com/chabuuuu" target="_blank" rel="noreferrer" className="hover:text-white transition"><Github size={18} /></a>
               <a href="https://www.facebook.com/thinhha123" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition"><Facebook size={18} /></a>
               <a href="https://www.youtube.com/@chabu4877" target="_blank" rel="noreferrer" className="hover:text-red-500 transition"><Youtube size={18} /></a>
               <Suspense>
                  <SearchInput />
               </Suspense>
            </div>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] pt-16 pb-8 mt-20">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-gray-400">
                {/* Blog Column */}
                <div>
                   <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Blog</h3>
                   <ul className="space-y-2">
                      <li><Link href="/" className="hover:text-blue-400">Blog</Link></li>
                      <li><Link href="/archives" className="hover:text-blue-400">Archives</Link></li>
                      <li><Link href="/tags" className="hover:text-blue-400">Tags</Link></li>
                      <li><Link href="/categories" className="hover:text-blue-400">Categories</Link></li>
                      <li><Link href="/search" className="hover:text-blue-400">Search</Link></li>
                      <li><Link href="/about-me" className="hover:text-blue-400">About</Link></li>
                   </ul>
                </div>

                {/* Tai Lieu Column */}
                <div>
                    <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Tài liệu</h3>
                    <ul className="space-y-2">
                        <li><Link href="/category/backend" className="hover:text-blue-400">Backend</Link></li>
                        <li><Link href="/category/frontend" className="hover:text-blue-400">Frontend</Link></li>
                        <li><Link href="/category/devops" className="hover:text-blue-400">Devops</Link></li>
                        <li><Link href="/category/iot" className="hover:text-blue-400">IoT</Link></li>
                        <li><Link href="/category/ai" className="hover:text-blue-400">AI</Link></li>
                    </ul>
                </div>

                {/* About Column */}
                <div>
                    <h3 className="text-white font-bold mb-4 uppercase tracking-wider">About</h3>
                    <div className="space-y-2">
                        <p>This Blog</p>
                        <p>GitHub</p>
                        <p>Facebook</p>
                        <p>Linkedin</p>
                        <p>Portfolio</p>
                        <p>Email</p>
                        <p>Youtube</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-16 pt-8 border-t border-[#1a1a1a] text-center text-xs text-gray-600">
               <p>© 2025 haphuthinh</p>
               <p className="mt-2">Personal blog by <span className="text-blue-500">chabuuuu</span></p>
            </div>
        </footer>
        <FloatingSettings />
        </SettingsProvider>
      </body>
    </html>
  );
}
