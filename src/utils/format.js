const nf = new Intl.NumberFormat('en-IN'); // Bangladeshi grouping: 1,00,000

export const taka = (n) => `৳${nf.format(Number(n) || 0)}`;
export const num = (n) => nf.format(Number(n) || 0);

export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const dateOnly = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const timeOnly = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export const CATEGORY_LABEL = { ICON: 'Icon', BATSMAN: 'Batsman', BOWLER: 'Bowler', ALL_ROUNDER: 'All-Rounder', WICKET_KEEPER: 'Wicket Keeper', GENERAL: 'General' };
export const CATEGORIES = Object.keys(CATEGORY_LABEL);
export const SEASON_STATUSES = ['UPCOMING', 'REGISTRATION', 'AUCTION', 'RUNNING', 'COMPLETED', 'CANCELLED'];
export const nrr = (n) => `${n > 0 ? '+' : ''}${(n ?? 0).toFixed(3)}`;
export const title = (s = '') => s.charAt(0) + s.slice(1).toLowerCase().replaceAll('_', ' ');
