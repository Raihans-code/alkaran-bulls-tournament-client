import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setItems((list) => [...list.slice(-3), { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo(() => ({
    info: (m) => push(m, 'info'),
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  }), [push]);

  const tone = { info: 'border-sky/50', success: 'border-pitch', error: 'border-alert' };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto max-w-sm rounded-lg border bg-ink-700 px-4 py-3 text-sm shadow-xl ${tone[t.type]}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
