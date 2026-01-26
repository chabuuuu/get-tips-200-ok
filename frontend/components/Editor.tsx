"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Dynamically import FroalaEditor component to avoid SSR issues
const FroalaEditorComponent = dynamic(
  () => import('react-froala-wysiwyg'),
  { ssr: false }
);

interface EditorProps {
  model: string;
  onModelChange: (model: string) => void;
}

const Editor: React.FC<EditorProps> = ({ model, onModelChange }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Import Froala JS plugins only on client side
    require('froala-editor/js/plugins.pkgd.min.js');
  }, []);

  if (!isClient) return <p>Loading Editor...</p>;

  return (
    <FroalaEditorComponent
      tag='textarea'
      model={model}
      onModelChange={onModelChange}
      config={{
        placeholderText: 'Start writing...',
        charCounterCount: true,
        imageUploadURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/upload`,
        imageUploadMethod: 'POST',
        requestHeaders: {
             Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        events: {
            'image.beforeUpload': function (images: any) {
                // If needed to add custom headers dynamically
            }
        }
      }}
    />
  );
};

export default Editor;
