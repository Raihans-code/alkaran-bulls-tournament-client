import { taka, timeOnly } from '../utils/format.js';

export default function BidList({ bids = [], myTeamId, limit = 8 }) {
  if (!bids.length) return <p className="text-sm text-mist">No bids yet. The first bid opens the price.</p>;
  return (
    <ul className="divide-y divide-ink-line">
      {bids.slice(0, limit).map((b, i) => (
        <li key={b.id} className={`flex items-center justify-between py-2 text-sm ${i === 0 ? 'font-semibold' : 'text-slate-300'}`}>
          <span className="truncate">{b.teamName}{b.teamId === myTeamId && <span className="ml-1 text-pitch">(you)</span>}</span>
          <span className="flex items-baseline gap-3">
            <span className="hidden text-xs text-mist sm:inline">{timeOnly(b.createdAt)}</span>
            <span className={`num text-lg ${i === 0 ? 'text-gold' : ''}`}>{taka(b.amount)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
