interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rectangular', width, height }: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChannelList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <Skeleton variant="text" width={20} height={16} />
          <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} height={16} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMessageList({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
            <Skeleton variant="text" width={`${40 + Math.random() * 50}%`} height={16} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMemberList({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-2">
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="text" width={150} height={12} />
            </div>
          </div>
          <Skeleton variant="text" width={60} height={24} />
        </div>
      ))}
    </div>
  );
}
