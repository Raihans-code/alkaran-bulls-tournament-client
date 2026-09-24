import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const POLL_INTERVAL = 5000;

/** Scoreboard that updates instantly whenever the scorer changes something. */
export function useLiveMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId) return undefined;
    let alive = true;
    const load = () => api.matches.get(matchId)
      .then((m) => { if (alive) { setMatch(m); setError(null); } })
      .catch((e) => alive && setError(e));
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => { alive = false; clearInterval(timer); };
  }, [matchId]);

  return { match, error, setMatch };
}
