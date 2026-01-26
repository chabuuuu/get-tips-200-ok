"use client";

import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from '@/components/SyntaxHighlighter';
import { useSettings } from '@/context/SettingsContext';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  const { fontSize } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      return (
        <div className="relative">
             <div className="prose prose-lg dark:prose-invert mx-auto max-w-none text-gray-700 dark:text-gray-300"
                style={{ fontSize: '16px' }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
      );
  }

  return (
    <div className="relative">
      <div 
        className="prose prose-lg dark:prose-invert mx-auto max-w-none text-gray-700 dark:text-gray-300 transition-all duration-200 ease-in-out"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <SyntaxHighlighter />
    </div>
  );
}
