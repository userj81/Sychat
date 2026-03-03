'use client';

import { useState, useRef, useCallback } from 'react';

interface AvatarPreviewProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export function AvatarPreview({ value, onChange, name, size = 'lg' }: AvatarPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter menos de 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const pixelSize = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={handleClick}
        className="cursor-pointer relative group"
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="rounded-full object-cover border-4 border-emerald-100"
            style={{ width: pixelSize, height: pixelSize }}
          />
        ) : (
          <div
            className="rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold border-4 border-emerald-100"
            style={{ width: pixelSize, height: pixelSize, fontSize: pixelSize * 0.4 }}
          >
            {name[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-sm text-gray-500 mt-2">Clique na foto para alterar</p>
    </div>
  );
}
