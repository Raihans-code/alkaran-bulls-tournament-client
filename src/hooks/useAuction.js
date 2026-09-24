import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { emitAck, getSocket } from '../services/socket.js';

const POLL_INTERVAL = 5000;

/**
 * Live auction state for a season. The server is authoritative: this hook only renders
 * snapshots pushed by Socket.IO and sends bid *intents* (season + amount).
 */
export function useAuction(seasonId) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!seasonId) return undefined;
    let alive = true;
    setState(null);
    const load = () => api.auctions.state(seasonId)
      .then((snap) => { if (alive) { setState(snap); setConnected(true); } })
      .catch(() => alive && setConnected(false));
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => { alive = false; clearInterval(timer); };
  }, [seasonId]);

  const bid = useCallback(async (amount, teamId) => {
    const body = { seasonId, amount, ...(teamId ? { teamId } : {}) };
    // Socket first (lowest latency); REST fallback if the socket is down.
    return getSocket().connected ? emitAck('auction:bid', body) : api.bids.place(body);
  }, [seasonId]);

  return { state, connected, lastEvent, bid };
}
