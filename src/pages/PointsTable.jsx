import { useSeason } from '../context/SeasonContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api } from '../services/api.js';
import { Async, Empty, PageHeader } from '../components/ui.jsx';
import StandingsTable from '../components/StandingsTable.jsx';

export default function PointsTable() {
  const { seasonId, season } = useSeason();
  const { user } = useAuth();
  const standings = useFetch(() => (seasonId ? api.standings.list(seasonId) : null), [seasonId]);
  const mine = useFetch(() => (seasonId ? api.teams.mine(seasonId) : null), [seasonId]);
  useSocketEvent('standings:update', () => standings.reload());
  if (!seasonId) return <Empty title="No season selected" />;
  return (
    <>
      <PageHeader title="Points table" subtitle={season ? `${season.name} • Win ${season.winPoints}, tie ${season.tiePoints}, no result ${season.noResultPoints}, loss ${season.lossPoints}` : ''} />
      <Async state={standings}>{(rows) => <StandingsTable rows={rows} highlightTeamIds={user.role === 'ADMIN' ? [] : (mine.data ?? []).map((t) => t.id)} />}</Async>
      <p className="mt-3 text-xs text-mist">Net run rate uses the full overs quota for an all-out innings. The table is rebuilt from completed matches every time a result changes.</p>
    </>
  );
}
