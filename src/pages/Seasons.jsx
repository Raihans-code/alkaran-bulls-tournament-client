import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSeason } from '../context/SeasonContext.jsx';
import { Button, Card, Empty, PageHeader, StatusBadge } from '../components/ui.jsx';

export default function Seasons() {
  const { seasons, setSeasonId } = useSeason();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Seasons" subtitle="Every season keeps its own teams, players, auction and results." />
      {!seasons.length && <Empty title="No seasons yet" />}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-display text-2xl font-bold">{s.name}</div><div className="text-xs text-mist">Season {s.seasonNumber} • {s.year}</div></div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div><div className="num text-xl font-bold">{s._count.teams}</div><div className="text-xs text-mist">Teams</div></div>
              <div><div className="num text-xl font-bold">{s._count.players}</div><div className="text-xs text-mist">Players</div></div>
              <div><div className="num text-xl font-bold">{s._count.matches}</div><div className="text-xs text-mist">Matches</div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={isAdmin ? `/admin/seasons/${s.id}` : `/seasons/${s.id}`} className="btn-ghost btn-sm">Details</Link>
              {!isAdmin && s.status === 'REGISTRATION' && <Button size="sm" onClick={() => { setSeasonId(s.id); navigate('/my-team'); }}>Join season</Button>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
