import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Async, Card, Stat } from './ui.jsx';
import { num, taka } from '../utils/format.js';

export default function SeasonStats({ seasonId }) {
  const state = useFetch(() => api.stats.season(seasonId), [seasonId]);
  return (
    <Async state={state}>
      {(s) => (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Players sold" value={`${s.totals.sold} / ${s.totals.players}`} />
            <Stat label="Unsold" value={s.totals.unsold} />
            <Stat label="Total spent" value={taka(s.totals.totalSpent)} tone="gold" />
            <Stat label="Matches played" value={s.totals.matchesPlayed} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-2xl font-bold">Most expensive players</h3>
              <div className="overflow-hidden rounded-xl border border-ink-line">
                {s.topPurchases.length ? s.topPurchases.map((p) => (
                  <div key={p.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-t border-ink-line px-3 py-2.5 first:border-t-0">
                    <div className="min-w-0"><div className="break-words text-sm font-semibold">{p.player.name}</div><div className="break-words text-xs text-mist">{p.team.name}</div></div>
                    <div className="num self-center whitespace-nowrap text-sm text-gold">{taka(p.price)}</div>
                  </div>
                )) : <p className="px-3 py-2.5 text-sm text-mist">No sales yet.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <Card>
                <h3 className="mb-2 text-2xl font-bold">Most runs</h3>
                {s.mostRuns.length ? s.mostRuns.map((r) => <div key={r.playerId} className="flex min-w-0 items-start justify-between gap-3 py-1 text-sm"><span className="min-w-0 break-words">{r.name} <span className="text-mist">{r.team}</span></span><b className="num shrink-0">{num(r.runs)}</b></div>) : <p className="text-sm text-mist">No player statistics recorded yet.</p>}
              </Card>
              <Card>
                <h3 className="mb-2 text-2xl font-bold">Most wickets</h3>
                {s.mostWickets.length ? s.mostWickets.map((r) => <div key={r.playerId} className="flex min-w-0 items-start justify-between gap-3 py-1 text-sm"><span className="min-w-0 break-words">{r.name} <span className="text-mist">{r.team}</span></span><b className="num shrink-0">{r.wickets}</b></div>) : <p className="text-sm text-mist">No player statistics recorded yet.</p>}
              </Card>
            </div>
          </div>
        </div>
      )}
    </Async>
  );
}
