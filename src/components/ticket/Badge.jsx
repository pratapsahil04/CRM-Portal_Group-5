import React from 'react';

export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-slate-100 border-slate-200 text-slate-700',
    medium: 'bg-zinc-100 border-zinc-200 text-zinc-700',
    high: 'bg-amber-100 border-amber-200 text-amber-800',
    critical: 'bg-red-100 border-red-200 text-red-800 font-extrabold uppercase tracking-wider',
  };
  return (
    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded border tracking-wide ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    open: 'bg-sky-100 border-sky-200 text-sky-700',
    in_progress: 'bg-yellow-100 border-yellow-250 text-yellow-800',
    on_hold: 'bg-orange-100 border-orange-200 text-orange-800',
    resolved: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    closed: 'bg-zinc-100 border-zinc-250 text-zinc-500',
  };
  return (
    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded border ${styles[status] || styles.open}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}
