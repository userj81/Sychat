'use client';

import { useState, useRef } from 'react';
import { FileUpload } from './FileUpload';
import { Button } from './Button';

interface MessageComposerProps {
  onSend: (message: string) => void;
  onFileUpload?: (files: File[]) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  onFileUpload,
  onChange,
  placeholder = 'Digite uma mensagem...',
  disabled = false,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && uploadedFiles.length === 0) return;
    
    onSend(message);
    setMessage('');
    setUploadedFiles([]);
    setShowUpload(false);
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    onFileUpload?.(files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const chips = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      ),
      label: 'Anexar',
      onClick: () => setShowUpload(!showUpload),
      active: showUpload,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Emoji',
      onClick: () => {
        // TODO: Implement emoji picker
      },
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: 'Link',
      onClick: () => {
        const url = prompt('Cole o link:');
        if (url) {
          setMessage((prev) => prev + ' ' + url);
          inputRef.current?.focus();
        }
      },
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: 'Código',
      onClick: () => {
        setMessage((prev) => prev + '```\n\n```');
        inputRef.current?.focus();
      },
      hidden: localStorage.getItem('code_enabled') === 'false',
    },
  ];

  return (
    <div className="border-t p-4 bg-white dark:bg-gray-900">
      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File upload area */}
      {showUpload && (
        <div className="mb-3">
          <FileUpload
            onUpload={handleFileUpload}
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
          />
        </div>
      )}

      {/* Chips */}
      <div className="flex gap-1 mb-3">
        {chips.map((chip, index) => {
          if (chip.hidden) return null;
          return (
            <button
              key={index}
              type="button"
              onClick={chip.onClick}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors duration-200
                ${chip.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }
              `}
              title={chip.label}
            >
              {chip.icon}
              <span className="hidden sm:inline">{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onChange?.(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || (!message.trim() && uploadedFiles.length === 0)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </form>
    </div>
  );
}
