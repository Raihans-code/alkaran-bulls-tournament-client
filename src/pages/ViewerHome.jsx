import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../context/SeasonContext.jsx';
import { useAuction } from '../hooks/useAuction.js';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Async, Card, Empty, PageHeader, StatusBadge } from '../components/ui.jsx';
import MatchCard from '../components/ScoreCard.jsx';
import StandingsTable from '../components/StandingsTable.jsx';
import { taka } from '../utils/format.js';

export default function ViewerHome() {
  const { season, seasonId } = useSeason();
  const { state, connected } = useAuction(seasonId);
  const matches = useFetch(() => (seasonId ? api.matches.list(seasonId) : null), [seasonId]);
  const standings = useFetch(() => (seasonId ? api.standings.list(seasonId) : null), [seasonId]);
  const upcoming = useMemo(() => (matches.data ?? []).filter((m) => ['UPCOMING', 'LIVE'].includes(m.status)).slice(0, 3), [matches.data]);
  const results = useMemo(() => (matches.data ?? []).filter((m) => ['COMPLETED', 'ABANDONED'].includes(m.status)).slice(-3).reverse(), [matches.data]);
  const auction = state?.auction;

  if (!season) return <Empty title="No season yet">An admin hasn't created a season. Check back soon.</Empty>;

  return (
    <>
      <PageHeader
        title="Tournament home"
        subtitle={<>{season.name} <StatusBadge status={season.status} /></>}
        actions={<span className={`text-sm ${connected ? 'text-pitch' : 'text-mist'}`}>{connected ? 'Live updates on' : 'Connecting…'}</span>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card className="border-pitch/30 bg-[radial-gradient(circle_at_80%_0%,#164438_0%,#0b1928_58%,#07101a_100%)]">
          <div className="text-xs uppercase tracking-[0.18em] text-pitch">Follow the action</div>
          <h2 className="mt-2 max-w-full break-words font-display text-3xl font-bold sm:text-4xl">Everything happening this season.</h2>
          <p className="mt-3 max-w-xl text-sm text-mist sm:text-base">Watch the auction, follow every scheduled match, and see the standings update as results come in.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/matches" className="btn-primary">View schedule</Link>
            <Link to="/auction" className="btn-ghost">Open auction</Link>
          </div>
        </Card>
        <Card className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3"><h2 className="text-2xl font-bold">Live auction</h2><Link to="/auction" className="text-sm text-pitch">Details</Link></div>
          {auction ? (
            <div className="mt-4 min-w-0"><div className="break-words font-display text-2xl font-bold sm:text-3xl">{auction.player.name}</div><div className="mt-2 text-sm text-mist">Current bid</div><div className="num text-3xl font-bold text-gold sm:text-4xl">{taka(auction.currentBid)}</div></div>
          ) : <p className="mt-3 text-sm text-mist">No player is on the block right now.</p>}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Schedule</h2><Link to="/matches" className="text-sm text-pitch">See all</Link></div>
          <Async state={matches}>{() => <div className="space-y-3">{upcoming.map((match) => <MatchCard key={match.id} match={match} />)}{!upcoming.length && <p className="text-sm text-mist">No matches scheduled yet.</p>}</div>}</Async>
        </section>
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Points table</h2><Link to="/points-table" className="text-sm text-pitch">Full table</Link></div>
          <Async state={standings}>{(rows) => <StandingsTable rows={(rows ?? []).slice(0, 5)} compact />}</Async>
        </section>
      </div>

      <section className="mt-8 min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Recent results</h2><Link to="/history" className="text-sm text-pitch">Match history</Link></div>
        <div className="grid gap-3 md:grid-cols-3">{results.map((match) => <MatchCard key={match.id} match={match} />)}{!results.length && <p className="text-sm text-mist">No results yet.</p>}</div>
      </section>
    </>
  );
}
