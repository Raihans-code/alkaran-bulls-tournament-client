import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { Async, Card, Stat, Table } from './ui.jsx';
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
              <Table head={['Player', 'Team', 'Price']}>
                {s.topPurchases.map((p) => (
                  <tr key={p.id}><td className="td font-semibold">{p.player.name}</td><td className="td">{p.team.name}</td><td className="td num text-gold">{taka(p.price)}</td></tr>
                ))}
                {!s.topPurchases.length && <tr><td className="td text-mist" colSpan={3}>No sales yet.</td></tr>}
              </Table>
            </div>
            <div className="space-y-4">
              <Card>
                <h3 className="mb-2 text-2xl font-bold">Most runs</h3>
                {s.mostRuns.length ? s.mostRuns.map((r) => <div key={r.playerId} className="flex justify-between py-1 text-sm"><span>{r.name} <span className="text-mist">{r.team}</span></span><b className="num">{num(r.runs)}</b></div>) : <p className="text-sm text-mist">No player statistics recorded yet.</p>}
              </Card>
              <Card>
                <h3 className="mb-2 text-2xl font-bold">Most wickets</h3>
                {s.mostWickets.length ? s.mostWickets.map((r) => <div key={r.playerId} className="flex justify-between py-1 text-sm"><span>{r.name} <span className="text-mist">{r.team}</span></span><b className="num">{r.wickets}</b></div>) : <p className="text-sm text-mist">No player statistics recorded yet.</p>}
              </Card>
            </div>
          </div>
        </div>
      )}
    </Async>
  );
}
