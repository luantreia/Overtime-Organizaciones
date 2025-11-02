import { useState, type ReactNode } from 'react';

export default function HelpBadge({ label = 'Ayuda', children, defaultOpen = false }: { label?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="inline-flex items-start gap-2">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
        title={label}
      >
        ?
      </button>
      {open ? (
        <div className="max-w-prose rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          {children}
        </div>
      ) : null}
    </div>
  );
}
