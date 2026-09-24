import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { errorMessage } from '../services/api.js';

const POLL_INTERVAL = 5000;

/** Loads data with loading/error state. `fn` returning null/undefined skips the request. */
export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async (silent = false) => {
    const promise = fnRef.current();
    if (!promise) { setData(null); setLoading(false); return; }
    if (!silent) setLoading(true);
    try { setData(await promise); setError(null); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  const reload = useCallback(() => load(true), [load]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);

  useEffect(() => {
    const timer = setInterval(() => load(true), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return useMemo(() => ({ data, loading, error, reload, setData }), [data, loading, error, reload]);
}
