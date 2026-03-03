'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
}

export function FileUpload({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md'],
  },
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles.map((f) => {
          if (f.errors[0]?.code === 'file-too-large') {
            return `${f.file.name} é muito grande`;
          }
          if (f.errors[0]?.code === 'file-invalid-type') {
            return `${f.file.name} não é permitido`;
          }
          return `${f.file.name} rejeitado`;
        });
        setError(reasons.join(', '));
        return;
      }

      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive && !isDragReject ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          ${!isDragActive ? 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${isDragActive ? 'text-emerald-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isDragActive ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              {isDragReject ? 'Alguns arquivos não são permitidos' : 'Solte os arquivos aqui...'}
            </p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Arraste arquivos aqui
              </p>
              <p className="text-sm text-gray-400 mt-1">
                ou <span className="text-emerald-600 dark:text-emerald-400">clique para selecionar</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Máx. {maxFiles} arquivos, {(maxSize / 1024 / 1024).toFixed(0)}MB cada
              </p>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
