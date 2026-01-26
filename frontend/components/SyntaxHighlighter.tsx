"use client";

import { useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Or any other theme

export default function SyntaxHighlighter() {
  useEffect(() => {
    hljs.highlightAll();
  }, []);

  return null;
}
