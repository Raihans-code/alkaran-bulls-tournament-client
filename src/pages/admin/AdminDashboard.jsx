import { Link } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { api } from '../../services/api.js';
import { Async, Card, Empty, PageHeader, Stat, StatusBadge } from '../../components/ui.jsx';
import { taka } from '../../utils/format.js';

const ACTIONS = [
  ['/admin/seasons', 'Create season'], ['/admin/teams', 'Manage teams'], ['/admin/players', 'Manage players'], ['/admin/auction', 'Start auction'],
  ['/admin/matches', 'Manage matches'], ['/admin/scores', 'Update score'], ['/points-table', 'View points table'], ['/admin/settings', 'Tournament settings'],
];

export default function AdminDashboard() {
  const { seasonId } = useSeason();
  const overview = useFetch(() => api.admin.overview(seasonId || undefined), [seasonId]);
  useSocketEvent(['teams:update', 'auction:state', 'standings:update'], () => overview.reload());
  return (
    <>
      <PageHeader title="Admin overview" subtitle="Everything happening in the selected season." />
      <Async state={overview}>
        {(o) => !o.season ? (
          <Empty title="Create your first season" action={<Link to="/admin/seasons" className="btn-primary">Create season</Link>}>Seasons keep teams, players, auctions and results separate from each other.</Empty>
        ) : (
          <>
            <Card className="mb-4 flex flex-wrap items-center gap-3">
              <div className="mr-auto"><div className="text-xs text-mist">Active season</div><div className="font-display text-3xl font-bold">{o.season.name}</div></div>
              <StatusBadge status={o.season.status} />
              <Link to={`/admin/seasons/${o.season.id}`} className="btn-ghost btn-sm">Manage stage and settings</Link>
            </Card>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Registered teams" value={o.counts.teams} />
              <Stat label="Approved teams" value={`${o.counts.approved} / ${o.season.maxTeams}`} tone="green" />
              <Stat label="Awaiting approval" value={o.counts.pending} tone={o.counts.pending ? 'gold' : undefined} />
              <Stat label="Total players" value={o.counts.players} />
              <Stat label="Players sold" value={o.counts.sold} tone="green" />
              <Stat label="Players unsold" value={o.counts.unsold} />
              <Stat label="Matches played" value={o.counts.matchesPlayed} />
              <Stat label="Live matches" value={o.counts.liveMatches} />
            </div>
            <Card className="mt-3">
              <div className="text-xs text-mist">Current auction</div>
              {o.currentAuction ? <div className="font-display text-2xl font-bold">{o.currentAuction.player} <span className="num text-gold">{taka(o.currentAuction.currentBid)}</span></div> : <div className="text-mist">No player on the block.</div>}
            </Card>
            <h2 className="mb-2 mt-6 text-3xl font-bold">Quick actions</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map(([to, label]) => <Link key={to} to={to} className="btn-ghost justify-start !py-3 text-base">{label}</Link>)}
            </div>
          </>
        )}
      </Async>
    </>
  );
}
