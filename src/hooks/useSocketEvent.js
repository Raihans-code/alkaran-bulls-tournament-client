import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket.js';

/** Subscribe to one or more Socket.IO events for the lifetime of the component. */
export function useSocketEvent(events, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  const key = [].concat(events).join('|');
  useEffect(() => {
    const s = getSocket();
    const list = [].concat(events);
    const fn = (...args) => ref.current(...args);
    list.forEach((e) => s.on(e, fn));
    return () => list.forEach((e) => s.off(e, fn));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
