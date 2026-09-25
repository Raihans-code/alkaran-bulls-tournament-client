import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Async, Avatar, Card, PageHeader, Progress, StatusBadge } from '../components/ui.jsx';
import { CATEGORY_LABEL, taka } from '../utils/format.js';

export default function TeamDetail() {
  const { teamId } = useParams();
  const team = useFetch(() => api.teams.get(teamId), [teamId]);
  return (
    <Async state={team}>
      {(t) => (
        <>
          <PageHeader title={t.name} subtitle={`${t.season.name} • Owner: ${t.owner.name}`} actions={<Link to="/teams" className="btn-ghost btn-sm">All teams</Link>} />
          <Card className="mb-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={t.name} src={t.logo} size={64} />
              <StatusBadge status={t.registrationStatus} />
              <div className="grid w-full grid-cols-1 gap-3 text-center sm:ml-auto sm:w-auto sm:grid-cols-3 sm:gap-6">
                <div><div className="text-xs text-mist">Purse</div><div className="num text-2xl font-bold text-gold">{taka(t.purse)}</div></div>
                <div><div className="text-xs text-mist">Spent</div><div className="num text-2xl font-bold">{taka(t.totalSpent)}</div></div>
                <div><div className="text-xs text-mist">Players</div><div className="num text-2xl font-bold">{t.squadCount} / {t.maxPlayers}</div></div>
              </div>
            </div>
            <div className="mt-3"><Progress value={t.squadCount} max={t.maxPlayers} tone={t.squadFull ? 'gold' : 'green'} /></div>
            {t.squadFull && <p className="mt-2 font-display text-lg font-bold text-gold">SQUAD FULL</p>}
          </Card>
          <h2 className="mb-2 text-3xl font-bold">Squad</h2>
          <ol className="grid gap-2 sm:grid-cols-2">
            {t.squad.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-ink-line bg-ink-800 px-3 py-2.5">
                <span className="num w-6 text-lg text-mist">{i + 1}</span>
                <Avatar name={s.player.name} src={s.player.image} size={32} />
                <div className="mr-auto"><div className="font-semibold">{s.player.name}</div><div className="text-xs text-mist">{CATEGORY_LABEL[s.player.category]}</div></div>
                <span className="num text-gold">{taka(s.price)}</span>
              </li>
            ))}
            {!t.squad.length && <p className="text-sm text-mist">No players signed yet.</p>}
          </ol>
        </>
      )}
    </Async>
  );
}
