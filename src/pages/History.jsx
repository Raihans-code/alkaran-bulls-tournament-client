import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Async, Button, Card, Empty, PageHeader, StatusBadge } from '../components/ui.jsx';
import SeasonStats from '../components/SeasonStats.jsx';
import StandingsTable from '../components/StandingsTable.jsx';
import MatchCard from '../components/ScoreCard.jsx';
import { taka } from '../utils/format.js';

function SeasonRecords({ seasonId }) {
  const standings = useFetch(() => api.standings.list(seasonId), [seasonId]);
  const matches = useFetch(() => api.matches.list(seasonId, 'COMPLETED'), [seasonId]);
  return (
    <div className="mt-4 space-y-6 border-t border-ink-line pt-4">
      <div><h3 className="mb-2 text-2xl font-bold">Final points table</h3><Async state={standings}>{(rows) => <StandingsTable rows={rows} />}</Async></div>
      <div>
        <h3 className="mb-2 text-2xl font-bold">Match results</h3>
        <Async state={matches}>{(list) => <div className="grid gap-3 md:grid-cols-2">{list.map((m) => <MatchCard key={m.id} match={m} />)}{!list.length && <p className="text-sm text-mist">No completed matches.</p>}</div>}</Async>
      </div>
      <div><h3 className="mb-2 text-2xl font-bold">Auction and player records</h3><SeasonStats seasonId={seasonId} /></div>
    </div>
  );
}

export default function History() {
  const state = useFetch(() => api.stats.history(), []);
  const [open, setOpen] = useState(null);
  return (
    <>
      <PageHeader title="Tournament history" subtitle="Champions, squads, auctions and results from every season." />
      <Async state={state}>
        {({ seasons, allTimeHighestPurchase: top }) => (
          <>
            {top && (
              <Card className="mb-5 border-gold/50">
                <div className="text-xs text-gold">All-time highest purchase</div>
                <div className="font-display text-3xl font-bold">{top.player.name} <span className="num text-gold">{taka(top.price)}</span></div>
                <div className="text-sm text-mist">{top.team.name} • {top.season.name}</div>
              </Card>
            )}
            {!seasons.length && <Empty title="No seasons yet" />}
            <div className="space-y-3">
              {seasons.map((s) => (
                <Card key={s.id}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="mr-auto">
                      <div className="font-display text-2xl font-bold">{s.name}</div>
                      <div className="text-xs text-mist">{s.year} • {s._count.teams} teams • {s._count.players} players • {s._count.matches} matches</div>
                    </div>
                    <StatusBadge status={s.status} />
                    {s.champion && <div className="text-right"><div className="text-xs text-gold">Champions</div><div className="font-semibold">{s.champion.name}</div></div>}
                    {s.mostExpensive && <div className="text-right"><div className="text-xs text-mist">Top buy</div><div className="text-sm">{s.mostExpensive.player.name} <b className="num text-gold">{taka(s.mostExpensive.price)}</b></div></div>}
                    <Button size="sm" variant="ghost" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'Hide records' : 'View records'}</Button>
                  </div>
                  {open === s.id && <SeasonRecords seasonId={s.id} />}
                </Card>
              ))}
            </div>
          </>
        )}
      </Async>
    </>
  );
}
