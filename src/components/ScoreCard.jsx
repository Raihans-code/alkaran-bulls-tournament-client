import { Link } from 'react-router-dom';
import { Card, StatusBadge } from './ui.jsx';
import { dateTime } from '../utils/format.js';

export function InningsLine({ innings, teamName, big }) {
  if (!innings) return <div className="text-mist">{teamName}<span className="ml-2 text-sm">yet to bat</span></div>;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`truncate font-semibold ${big ? 'text-2xl' : ''}`}>{teamName}</span>
      <span className={`num font-bold ${big ? 'text-6xl' : 'text-2xl'}`}>
        {innings.runs}/{innings.wickets}
        <span className={`ml-2 font-normal text-mist ${big ? 'text-2xl' : 'text-sm'}`}>({innings.overs} ov)</span>
      </span>
    </div>
  );
}

export function inningsFor(match, teamId) {
  return match.innings?.find((i) => i.battingTeamId === teamId);
}

export default function MatchCard({ match, to }) {
  const a = inningsFor(match, match.teamAId);
  const b = inningsFor(match, match.teamBId);
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="mb-2 flex flex-col gap-1 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
        <span className="break-words">Match {match.matchNumber}{match.venue ? ` • ${match.venue}` : ''}</span>
        <StatusBadge status={match.status} />
      </div>
      <Link to={to ?? `/matches/${match.id}`} className="block min-w-0 space-y-1.5">
        <InningsLine innings={a} teamName={match.teamA.name} />
        <InningsLine innings={b} teamName={match.teamB.name} />
      </Link>
      <div className="mt-2 break-words text-xs text-mist">{match.status === 'COMPLETED' ? match.resultText : dateTime(match.scheduledAt)}</div>
    </Card>
  );
}
