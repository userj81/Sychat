'use client';

import { useState, useEffect } from 'react';

interface LinkPreviewProps {
  url: string;
}

interface PreviewData {
  title: string;
  description: string;
  image: string | null;
  siteName: string | null;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-emerald-600 dark:text-emerald-400 text-sm break-all">{url}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block max-w-md bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt={preview.title}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3">
        <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{preview.title}</p>
        {preview.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{preview.description}</p>
        )}
        {preview.siteName && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{preview.siteName}</p>
        )}
      </div>
    </a>
  );
}
