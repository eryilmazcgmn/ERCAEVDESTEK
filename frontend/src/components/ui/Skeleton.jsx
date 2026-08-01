import React from 'react';

/**
 * Reusable Skeleton loading component with shimmer animation.
 * Uses the existing .skeleton-shimmer CSS class.
 */

export function SkeletonLine({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="60%" height="0.875rem" />
          <SkeletonLine width="40%" height="0.625rem" />
        </div>
      </div>
      <SkeletonLine width="100%" height="2rem" />
      <div className="flex gap-2">
        <SkeletonLine width="30%" height="0.75rem" />
        <SkeletonLine width="20%" height="0.75rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={`h-${i}`} width={`${100 / cols}%`} height="0.75rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-gray-900/30">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonLine key={`${rowIdx}-${colIdx}`} width={`${100 / cols}%`} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <SkeletonLine width="70%" height="0.625rem" />
              <SkeletonLine width="40%" height="1.75rem" />
            </div>
            <div className="skeleton-shimmer w-12 h-12 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
            <SkeletonLine width="50%" height="0.875rem" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/40 flex items-center justify-between">
                  <div className="space-y-1.5 flex-1">
                    <SkeletonLine width="60%" height="0.75rem" />
                    <SkeletonLine width="40%" height="0.5rem" />
                  </div>
                  <SkeletonLine width="20%" height="1.25rem" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  SkeletonLine,
  SkeletonCard,
  SkeletonTable,
  SkeletonDashboard
};
