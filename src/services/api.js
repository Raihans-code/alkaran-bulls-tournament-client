import axios from 'axios';

export const TOKEN_KEY = 'ab_token';

const http = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api`, timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const code = err.response?.data?.error;
    if (err.response?.status === 401 && code !== 'INVALID_CREDENTIALS') window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(err);
  },
);

/** Human-readable message from any axios / socket error. */
export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : err?.message) || 'Something went wrong';

const unwrap = (p) => p.then((r) => r.data.data);
const get = (url, params) => unwrap(http.get(url, { params }));
const post = (url, body) => unwrap(http.post(url, body));
const patch = (url, body) => unwrap(http.patch(url, body));
const put = (url, body) => unwrap(http.put(url, body));
const del = (url) => unwrap(http.delete(url));

export const api = {
  auth: {
    login: (b) => post('/auth/login', b),
    register: (b) => post('/auth/register', b),
    me: () => get('/auth/me'),
  },
  seasons: {
    list: () => get('/seasons'),
    get: (id) => get(`/seasons/${id}`),
    create: (b) => post('/seasons', b),
    update: (id, b) => patch(`/seasons/${id}`, b),
    setStatus: (id, b) => post(`/seasons/${id}/status`, b),
  },
  teams: {
    list: (seasonId, status) => get('/teams', { seasonId, status }),
    mine: (seasonId) => get('/teams/mine', { seasonId }),
    get: (id) => get(`/teams/${id}`),
    register: (b) => post('/teams', b),
    update: (id, b) => patch(`/teams/${id}`, b),
    setRegistration: (id, status) => post(`/teams/${id}/registration`, { status }),
    adjustPurse: (id, b) => post(`/teams/${id}/purse`, b),
  },
  players: {
    list: (params) => get('/players', params),
    get: (id) => get(`/players/${id}`),
    create: (b) => post('/players', b),
    update: (id, b) => patch(`/players/${id}`, b),
    remove: (id) => del(`/players/${id}`),
    assignToTeam: (id, b) => post(`/players/${id}/assign`, b),
    removeFromTeam: (id) => post(`/players/${id}/remove-from-team`),
    import: (b) => post('/players/import', b),
    exportUrl: (seasonId) => http.get('/players/export', { params: { seasonId }, responseType: 'blob' }).then((r) => r.data),
  },
  auctions: {
    state: (seasonId) => get('/auctions/state', { seasonId }),
    history: (seasonId, playerId) => get('/auctions/history', { seasonId, playerId }),
    start: (b) => post('/auctions/start', b),
    sold: (seasonId) => post('/auctions/sold', { seasonId }),
    unsold: (seasonId) => post('/auctions/unsold', { seasonId }),
    withdraw: (seasonId) => post('/auctions/withdraw', { seasonId }),
    cancel: (seasonId) => post('/auctions/cancel', { seasonId }),
    resetPlayer: (playerId) => post('/auctions/reset-player', { playerId }),
  },
  bids: { place: (b) => post('/bids', b) },
  matches: {
    list: (seasonId, status) => get('/matches', { seasonId, status }),
    get: (id) => get(`/matches/${id}`),
    create: (b) => post('/matches', b),
    update: (id, b) => patch(`/matches/${id}`, b),
    remove: (id) => del(`/matches/${id}`),
    start: (id, b) => post(`/matches/${id}/start`, b),
    complete: (id, b) => post(`/matches/${id}/complete`, b),
  },
  scores: {
    updateInnings: (id, n, b) => put(`/scores/${id}/innings/${n}`, b),
    ball: (id, n, b) => post(`/scores/${id}/innings/${n}/ball`, b),
    saveStats: (id, rows) => put(`/scores/${id}/stats`, { rows }),
  },
  standings: { list: (seasonId) => get('/standings', { seasonId }) },
  stats: { season: (id) => get(`/statistics/seasons/${id}`), history: () => get('/statistics/history') },
  admin: {
    overview: (seasonId) => get('/admin/overview', { seasonId }),
    audit: (params) => get('/admin/audit-logs', params),
    users: () => get('/admin/users'),
    updateUser: (id, b) => patch(`/admin/users/${id}`, b),
  },
};
