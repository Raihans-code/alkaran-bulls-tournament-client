import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuction } from '../hooks/useAuction.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Async, Button, Card, Empty, PageHeader, Progress, Stat, StatusBadge } from '../components/ui.jsx';
import MatchCard from '../components/ScoreCard.jsx';
import StandingsTable from '../components/StandingsTable.jsx';
import { taka } from '../utils/format.js';

export default function UserDashboard() {
  const { isAdmin } = useAuth();
  const { season, seasonId } = useSeason();
  const toast = useToast();
  const { state, bid } = useAuction(seasonId);
  const [busy, setBusy] = useState(false);
  const mine = useFetch(() => (seasonId ? api.teams.mine(seasonId) : null), [seasonId]);
  const matches = useFetch(() => (seasonId ? api.matches.list(seasonId) : null), [seasonId]);
  const standings = useFetch(() => (seasonId ? api.standings.list(seasonId) : null), [seasonId]);
  const refreshMine = useCallback(() => mine.reload(), [mine.reload]);
  const refreshMatches = useCallback(() => matches.reload(), [matches.reload]);
  const refreshStandings = useCallback(() => standings.reload(), [standings.reload]);
  useSocketEvent('teams:update', refreshMine);
  useSocketEvent('score:update', refreshMatches);
  useSocketEvent('standings:update', refreshStandings);

  const upcoming = useMemo(() => (matches.data ?? []).filter((m) => ['UPCOMING', 'LIVE'].includes(m.status)).slice(0, 3), [matches.data]);
  const results = useMemo(() => (matches.data ?? []).filter((m) => m.status === 'COMPLETED').slice(-3).reverse(), [matches.data]);

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!season) return <Empty title="No season yet">An admin hasn't created a season. Check back soon.</Empty>;

  const team = mine.data?.[0];
  const a = state?.auction;
  const canBid = a && team?.registrationStatus === 'APPROVED' && !team.squadFull && a.highestBidTeam?.id !== team.id && team.purse >= state.nextBid;
  const place = async () => {
    setBusy(true);
    try { await bid(state.nextBid, team.id); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title={season.name} subtitle={<>Season status: <StatusBadge status={season.status} /></>} />
      <Async state={mine}>
        {() => team ? (
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="md:col-span-2">
              <div className="text-xs text-mist">My team</div>
              <div className="font-display text-3xl font-bold">{team.name}</div>
              <div className="mt-1"><StatusBadge status={team.registrationStatus} /></div>
              {team.registrationStatus === 'PENDING' && <p className="mt-2 text-sm text-gold">Waiting for admin approval. You can bid once approved.</p>}
            </Card>
            <Card>
              <div className="text-xs text-mist">Squad</div>
              <div className="num text-3xl font-bold">{team.squadCount} / {team.maxPlayers}</div>
              <div className="mt-2"><Progress value={team.squadCount} max={team.maxPlayers} /></div>
            </Card>
            <Stat label="Remaining purse" value={taka(team.purse)} tone="gold" />
          </div>
        ) : (
          <Empty title="You don't have a team in this season" action={season.status === 'REGISTRATION' ? <Link to="/my-team" className="btn-primary">Register a team</Link> : null}>
            {season.status === 'REGISTRATION' ? 'Registration is open. Pick a team name and wait for approval.' : 'Registration is not open for this season.'}
          </Empty>
        )}
      </Async>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3"><h2 className="text-2xl font-bold">Current auction</h2><Link to="/auction" className="shrink-0 text-sm text-pitch">Open auction room</Link></div>
          {a ? (
            <div className="mt-3 min-w-0">
              <div className="break-words font-display text-3xl font-bold">{a.player.name}</div>
              <div className="mt-2 flex flex-wrap gap-4 sm:gap-6">
                <div><div className="text-xs text-mist">Current bid</div><div className="num text-3xl font-bold text-gold">{taka(a.currentBid)}</div></div>
                <div><div className="text-xs text-mist">Next bid</div><div className="num text-3xl font-bold">{taka(state.nextBid)}</div></div>
              </div>
              {team && <Button variant="gold" className="mt-3 w-full !py-3" disabled={!canBid} loading={busy} onClick={place}>{canBid ? `BID ${taka(state.nextBid)}` : team.squadFull ? 'Squad full' : 'Bid unavailable'}</Button>}
            </div>
          ) : <p className="mt-2 text-sm text-mist">No player is on the block right now.</p>}
        </Card>
        <div className="min-w-0">
          <h2 className="mb-2 text-2xl font-bold">Points table</h2>
          <Async state={standings}>{(rows) => <StandingsTable rows={(rows ?? []).slice(0, 5)} compact highlightTeamIds={(mine.data ?? []).map((t) => t.id)} />}</Async>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="mb-2 text-2xl font-bold">Upcoming matches</h2>
          <div className="space-y-3">{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}{!upcoming.length && <p className="text-sm text-mist">No matches scheduled yet.</p>}</div>
        </div>
        <div className="min-w-0">
          <h2 className="mb-2 text-2xl font-bold">Recent results</h2>
          <div className="space-y-3">{results.map((m) => <MatchCard key={m.id} match={m} />)}{!results.length && <p className="text-sm text-mist">No results yet.</p>}</div>
        </div>
      </div>
    </>
  );
}
