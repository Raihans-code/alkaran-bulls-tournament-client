import { io } from 'socket.io-client';
import { TOKEN_KEY } from './api.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || undefined, {
      auth: (cb) => cb({ token: localStorage.getItem(TOKEN_KEY) }),
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/** Call after login/logout so the connection is re-authenticated with the current token. */
export function resetSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

/** Promise wrapper around an ack-style emit. */
export function emitAck(event, payload, timeout = 8000) {
  return new Promise((resolve, reject) => {
    getSocket().timeout(timeout).emit(event, payload, (err, res) => {
      if (err) return reject(new Error('The server did not respond in time'));
      if (!res?.success) return reject(Object.assign(new Error(res?.message || 'Request failed'), { code: res?.error, details: res?.details }));
      resolve(res.data);
    });
  });
}
