import React from 'react';
import { Zap } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin`} />
      {size !== 'sm' && (
        <p className="text-xs text-slate-600 animate-pulse">Loading…</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-900/40 animate-pulse">
          <Zap size={22} className="text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-slate-800 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-600">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      {spinner}
    </div>
  );
}
