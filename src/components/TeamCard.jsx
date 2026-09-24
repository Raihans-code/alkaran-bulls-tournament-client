import { Link } from 'react-router-dom';
import { Avatar, Card, Progress, StatusBadge, Badge } from './ui.jsx';
import { taka } from '../utils/format.js';

export default function TeamCard({ team, mine, actions }) {
  const full = team.squadFull;
  return (
    <Card className={mine ? 'border-pitch/60' : ''}>
      <div className="flex items-start gap-3">
        <Avatar name={team.name} src={team.logo} size={44} />
        <div className="min-w-0 flex-1">
          <Link to={`/teams/${team.id}`} className="block truncate font-display text-xl font-bold hover:text-pitch">{team.name}</Link>
          <div className="truncate text-xs text-mist">Owner: {team.owner?.name ?? '-'}</div>
        </div>
        {team.registrationStatus !== 'APPROVED' ? <StatusBadge status={team.registrationStatus} /> : full ? <Badge tone="gold">Squad full</Badge> : mine ? <Badge tone="green">My team</Badge> : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-mist">Players</span>
        <span className="num font-semibold">{team.squadCount} / {team.maxPlayers}</span>
      </div>
      <div className="mt-1"><Progress value={team.squadCount} max={team.maxPlayers} tone={full ? 'gold' : 'green'} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><div className="text-xs text-mist">Purse</div><div className="num text-lg font-bold text-gold">{taka(team.purse)}</div></div>
        <div><div className="text-xs text-mist">Spent</div><div className="num text-lg font-bold">{taka(team.totalSpent)}</div></div>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-line pt-3">{actions}</div>}
    </Card>
  );
}
