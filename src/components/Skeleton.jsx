import { memo } from 'react';

function Skeleton({ className = '', variant = 'text' }) {
  const base = 'animate-pulse bg-outline-variant/40 rounded-xl';
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full',
    chip: 'h-12 w-full rounded-xl',
    line: 'h-3 w-full',
  };

  return <div className={`${base} ${variants[variant] || variants.text} ${className}`} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" className="h-10 w-10 !rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" className="!h-4 !w-1/2" />
          <Skeleton variant="line" className="!w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="line" className={i === lines - 1 ? '!w-2/3' : ''} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 3, className = '' }) {
  return (
    <div className={`grid grid-cols-${columns} gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="chip" className="!h-20" />
      ))}
    </div>
  );
}

export function SkeletonTimeline({ count = 3 }) {
  return (
    <div className="card overflow-hidden divide-y divide-outline-variant/15">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton variant="avatar" className="!h-8 !w-8 !rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="line" className="!w-1/2" />
          </div>
          <Skeleton variant="line" className="!w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMap() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse bg-outline-variant/30" style={{ height: 'clamp(200px, 40vw, 400px)' }}>
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined text-outline/40 text-[40px]">map</span>
      </div>
    </div>
  );
}

export default memo(Skeleton);
