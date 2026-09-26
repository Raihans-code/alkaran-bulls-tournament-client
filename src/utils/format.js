const nf = new Intl.NumberFormat('en-IN'); // Bangladeshi grouping: 1,00,000

export const taka = (n) => `৳${nf.format(Number(n) || 0)}`;
export const num = (n) => nf.format(Number(n) || 0);

export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const dateOnly = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const timeOnly = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export const CATEGORY_LABEL = {
  A: 'Tier A', B: 'Tier B', C: 'Tier C', D: 'Tier D', E: 'Tier E', F: 'Tier F', G: 'Tier G', H: 'Tier H', I: 'Tier I', J: 'Tier J', K: 'Tier K', L: 'Tier L', M: 'Tier M', N: 'Tier N', O: 'Tier O', P: 'Tier P', Q: 'Tier Q', R: 'Tier R', S: 'Tier S', T: 'Tier T', U: 'Tier U', V: 'Tier V', W: 'Tier W', X: 'Tier X', Y: 'Tier Y', Z: 'Tier Z',
  NO_CATEGORY: 'No category',
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL);
export const SEASON_STATUSES = ['UPCOMING', 'REGISTRATION', 'AUCTION', 'RUNNING', 'COMPLETED', 'CANCELLED'];
export const nrr = (n) => `${n > 0 ? '+' : ''}${(n ?? 0).toFixed(3)}`;
export const title = (s = '') => s.charAt(0) + s.slice(1).toLowerCase().replaceAll('_', ' ');
