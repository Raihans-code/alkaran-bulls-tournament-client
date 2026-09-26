import { useEffect, useState } from 'react';
import { initials, title } from '../utils/format.js';

export const Button = ({ variant = 'primary', size, className = '', loading, children, ...rest }) => (
  <button className={`btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} disabled={loading || rest.disabled} {...rest}>
    {loading && <Spinner small />}
    {children}
  </button>
);

export const Card = ({ className = '', children, ...rest }) => <div className={`card ${className}`} {...rest}>{children}</div>;

export function Spinner({ small }) {
  const size = small ? 'h-4 w-4' : 'h-8 w-8';
  return <span role="status" aria-label="Loading" className={`inline-block ${size} animate-spin rounded-full border-2 border-mist/30 border-t-pitch`} />;
}

const TONES = {
  green: 'bg-pitch/15 text-pitch border-pitch/40',
  gold: 'bg-gold/15 text-gold border-gold/40',
  red: 'bg-alert/15 text-red-300 border-alert/40',
  blue: 'bg-sky/15 text-sky border-sky/40',
  gray: 'bg-ink-600 text-mist border-ink-line',
};
const STATUS_TONE = {
  APPROVED: 'green', SOLD: 'green', COMPLETED: 'gray', LIVE: 'red', RUNNING: 'green', REGISTRATION: 'blue', AUCTION: 'gold', IN_AUCTION: 'red',
  PENDING: 'gold', UNSOLD: 'gray', WITHDRAWN: 'gray', REJECTED: 'red', CANCELLED: 'red', UPCOMING: 'blue', ABANDONED: 'red', AVAILABLE: 'blue',
};
export const Badge = ({ tone = 'gray', children }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>{children}</span>
);
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'gray'}>{title(status)}</Badge>;

export const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-mist">{hint}</span>}
  </label>
);

export const PageHeader = ({ title: t, subtitle, actions }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-3xl font-bold leading-none sm:text-4xl">{t}</h1>
      {subtitle && <p className="mt-1.5 max-w-full break-words text-sm text-mist">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Empty = ({ title: t, children, action }) => (
  <div className="rounded-xl border border-dashed border-ink-line px-6 py-10 text-center">
    <p className="font-display text-xl">{t}</p>
    {children && <p className="mx-auto mt-1 max-w-md text-sm text-mist">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-xl border border-alert/40 bg-alert/10 px-5 py-4 text-sm">
    <p className="font-semibold text-red-200">Couldn't load this</p>
    <p className="mt-1 text-red-200/80">{message}</p>
    {onRetry && <Button variant="ghost" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>}
  </div>
);

/** Wraps a useFetch result with loading / error handling. */
export function Async({ state, children }) {
  if (state.loading && !state.data) return <div className="grid place-items-center py-16"><Spinner /></div>;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  return children(state.data);
}

export const Stat = ({ label, value, tone }) => (
  <Card>
    <div className="text-xs text-mist">{label}</div>
    <div className={`num mt-1 text-3xl font-bold ${tone === 'gold' ? 'text-gold' : tone === 'green' ? 'text-pitch' : ''}`}>{value}</div>
  </Card>
);

export const Table = ({ head, children, empty, minWidth = '640px' }) => (
  <div className="max-w-full overflow-x-auto rounded-xl border border-ink-line [overscroll-behavior-x:contain]">
    <table className="w-full border-collapse" style={{ minWidth }}>
      <thead><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
    {empty}
  </div>
);

export function Modal({ open, onClose, title: t, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t} className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-ink-line bg-ink-800 p-5 shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t}</h2>
          <button onClick={onClose} className="rounded p-1 text-mist hover:text-white" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title: t, message, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={t}>
      <p className="text-sm text-mist">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Avatar({ name, src, size = 40, className = '' }) {
  const defaultSrc = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || 'Alkaran Bulls')}&backgroundColor=12352f&textColor=f7c948`;
  const [imageSrc, setImageSrc] = useState(src || defaultSrc);
  const style = { width: size, height: size, fontSize: size * 0.38 };
  useEffect(() => setImageSrc(src || defaultSrc), [src, defaultSrc]);
  return imageSrc ? (
    <img src={imageSrc} alt={name} onError={() => setImageSrc(imageSrc === defaultSrc ? null : defaultSrc)} style={style} className={`rounded-full border border-ink-line object-cover ${className}`} />
  ) : (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full border-2 border-pitch/60 bg-ink-600 font-display font-bold ${className}`}>{initials(name)}</span>
  );
}

export const Progress = ({ value, max, tone = 'green' }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-ink-600" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
    <div className={`h-full ${tone === 'gold' ? 'bg-gold' : 'bg-pitch'}`} style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
  </div>
);
