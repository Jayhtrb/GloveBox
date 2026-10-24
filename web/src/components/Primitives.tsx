import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { AppDef } from '../data';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id="gb-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1687FF" />
          <stop offset="1" stopColor="#703BFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#gb-logo-grad)" />
      <rect x="14" y="20" width="36" height="26" rx="5" fill="none" stroke="#fff" strokeWidth="3.5" />
      <path d="M14 29 H50" stroke="#fff" strokeWidth="3.5" />
      <rect x="27" y="36" width="10" height="4" rx="2" fill="#fff" />
    </svg>
  );
}

export function Pill({ kind, children }: { kind?: 'sim' | 'live' | 'warn'; children: ReactNode }) {
  return <span className={`pill ${kind ?? ''}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    />
  );
}

/** Monogram tile standing in for a third-party logo. Original colors and text only. */
export function Mark({ app, small }: { app: Pick<AppDef, 'mark' | 'color'>; small?: boolean }) {
  return (
    <span className={`mark ${small ? 'sm' : ''}`} style={{ background: `linear-gradient(160deg, ${app.color}, #0b0f18)` }} aria-hidden="true">
      {app.mark}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 className="grow">{title}</h2>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
