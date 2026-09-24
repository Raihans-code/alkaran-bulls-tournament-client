import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { getSocket } from '../services/socket.js';

const SeasonContext = createContext(null);
export const useSeason = () => useContext(SeasonContext);

const KEY = 'ab_season';
const ACTIVE = ['REGISTRATION', 'AUCTION', 'RUNNING', 'UPCOMING'];

export function SeasonProvider({ children }) {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonIdState] = useState(localStorage.getItem(KEY)); // UI preference only, never business data
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.seasons.list();
      setSeasons(list);
      setSeasonIdState((cur) => {
        if (cur && list.some((s) => s.id === cur)) return cur;
        const pick = list.find((s) => ACTIVE.includes(s.status)) || list[0];
        return pick?.id ?? null;
      });
      return list;
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setSeasonId = useCallback((id) => { localStorage.setItem(KEY, id); setSeasonIdState(id); }, []);

  // Stay subscribed to the selected season's realtime room.
  useEffect(() => {
    if (!user || !seasonId) return undefined;
    const s = getSocket();
    const join = () => s.emit('season:join', { seasonId }, () => {});
    s.on('connect', join);
    if (s.connected) join();
    return () => { s.off('connect', join); s.emit('season:leave', { seasonId }); };
  }, [user, seasonId]);

  const season = seasons.find((s) => s.id === seasonId) || null;
  const value = useMemo(() => ({ seasons, season, seasonId: season?.id ?? null, setSeasonId, refresh, loading }), [seasons, season, setSeasonId, refresh, loading]);
  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}
