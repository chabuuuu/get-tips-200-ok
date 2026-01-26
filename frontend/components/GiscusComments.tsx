"use client";

import React from 'react';
import Giscus from '@giscus/react';
import { useSettings } from '@/context/SettingsContext';

export default function GiscusComments() {
  const { theme } = useSettings();

  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Comments</h3>
      <Giscus
        id="comments"
        repo="chabuuuu/Gitalk-GETTIPS200OK"
        repoId="R_kgDOKh_c4g"
        category="General"
        categoryId="DIC_kwDOKh_c4s4CaPaK"
        mapping="pathname"
        term="Welcome to my blog!"
        reactionsEnabled="0"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme === 'dark' ? 'noborder_gray' : 'light'}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}
