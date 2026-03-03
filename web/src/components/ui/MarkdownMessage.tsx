'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreview } from './LinkPreview';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  const urls = content.match(urlRegex) || [];

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isInline = !match;
            
            if (isInline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            return (
              <code
                className={`${codeClassName} block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto">
              {children}
            </pre>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {urls.length > 0 && (
        <div className="mt-2 space-y-2 not-prose">
          {urls.slice(0, 1).map((url) => (
            <LinkPreview key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
