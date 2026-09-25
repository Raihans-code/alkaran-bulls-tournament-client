import { useEffect, useMemo, useState } from 'react';
import { useSeason } from '../../context/SeasonContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useLiveMatch } from '../../hooks/useLiveMatch.js';
import { api, errorMessage } from '../../services/api.js';
import { Async, Button, Card, Empty, Field, Modal, PageHeader } from '../../components/ui.jsx';
import CompleteMatchModal from '../../components/CompleteMatchModal.jsx';

const BALLS = [
  ['0', { runs: 0 }], ['1', { runs: 1 }], ['2', { runs: 2 }], ['3', { runs: 3 }], ['4', { runs: 4 }], ['6', { runs: 6 }],
  ['Wd', { runs: 0, extraType: 'WD' }], ['Nb', { runs: 0, extraType: 'NB' }], ['Bye', { runs: 1, extraType: 'B' }], ['LB', { runs: 1, extraType: 'LB' }],
];

function StatsEditor({ match, players, onClose }) {
  const toast = useToast();
  const [rows, setRows] = useState({});
  const [busy, setBusy] = useState(false);
  const existing = Object.fromEntries((match.stats ?? []).map((s) => [s.playerId, s]));
  const fields = [['runs', 'Runs'], ['ballsFaced', 'Balls'], ['fours', '4s'], ['sixes', '6s'], ['wickets', 'Wkts'], ['ballsBowled', 'Balls bowled'], ['runsConceded', 'Conceded']];
  const value = (p, k) => rows[p.id]?.[k] ?? existing[p.id]?.[k] ?? 0;
  const setVal = (p, k, v) => setRows({ ...rows, [p.id]: { ...(rows[p.id] ?? {}), [k]: Number(v) || 0 } });

  const save = async () => {
    const payload = Object.keys(rows).map((playerId) => {
      const p = players.find((x) => x.id === playerId);
      return { playerId, ...Object.fromEntries(fields.map(([k]) => [k, value(p, k)])) };
    });
    if (!payload.length) return onClose();
    setBusy(true);
    try { await api.scores.saveStats(match.id, payload); toast.success('Player statistics saved'); onClose(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-ink-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr><th className="th">Player</th>{fields.map(([, l]) => <th key={l} className="th">{l}</th>)}</tr></thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td className="td whitespace-nowrap font-semibold">{p.name}</td>
                {fields.map(([k]) => <td key={k} className="td"><input className="input !w-16 !px-2 !py-1" type="number" min={0} value={value(p, k)} onChange={(e) => setVal(p, k, e.target.value)} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button className="mt-3" loading={busy} onClick={save}>Save statistics</Button>
    </div>
  );
}

function Console({ matchId, seasonId }) {
  const toast = useToast();
  const { match, setMatch } = useLiveMatch(matchId);
  const [n, setN] = useState(1);
  const [manual, setManual] = useState(null);
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [stats, setStats] = useState(false);
  const squads = useFetch(() => api.players.list({ seasonId, status: 'SOLD' }), [seasonId]);

  const inn = match?.innings.find((i) => i.inningsNumber === n);
  useEffect(() => { if (match && !match.innings.some((i) => i.inningsNumber === n)) setN(match.innings.length ? match.innings.at(-1).inningsNumber : 1); }, [match, n]);
  useEffect(() => { setManual(inn ? { runs: inn.runs, wickets: inn.wickets, overs: inn.overs, extras: inn.extras, target: inn.target ?? '' } : null); }, [inn?.id, inn?.updatedAt]);

  const batters = useMemo(() => (squads.data ?? []).filter((p) => p.currentTeamId === inn?.battingTeamId), [squads.data, inn?.battingTeamId]);
  const bowlers = useMemo(() => (squads.data ?? []).filter((p) => p.currentTeamId === inn?.bowlingTeamId), [squads.data, inn?.bowlingTeamId]);
  if (!match) return null;

  const run = async (fn) => {
    setBusy(true);
    try { setMatch(await fn()); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const teamName = (id) => (id === match.teamAId ? match.teamA.name : match.teamB.name);
  const locked = inn?.status === 'COMPLETED';
  const bowlerRequired = inn && !inn.bowlerId && !locked;
  const batterRequired = inn && (!inn.strikerId || !inn.nonStrikerId) && !locked;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2].map((k) => {
            const exists = match.innings.some((i) => i.inningsNumber === k);
            return <Button key={k} size="sm" variant={n === k ? 'primary' : 'ghost'} disabled={!exists} onClick={() => setN(k)}>Innings {k}</Button>;
          })}
          {match.status === 'LIVE' && !match.innings.some((i) => i.inningsNumber === 2) && match.innings.length === 1 && (
            <Button size="sm" variant="gold" onClick={() => { run(() => api.scores.updateInnings(matchId, 2, {})); setN(2); }}>Start second innings</Button>
          )}
          <span className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setStats(true)}>Player stats</Button>
            <Button size="sm" variant="gold" onClick={() => setCompleting(true)}>{match.status === 'COMPLETED' ? 'Correct result' : 'Complete match'}</Button>
          </span>
        </div>
        {inn ? (
          <div className="mt-4 text-center">
            <div className="text-sm text-mist">{teamName(inn.battingTeamId)} batting{inn.target ? ` • target ${inn.target}` : ''}</div>
            <div className="num text-5xl font-extrabold text-gold sm:text-7xl">{inn.runs}/{inn.wickets}</div>
            <div className="num text-2xl text-mist">{inn.overs} / {match.oversLimit} overs • extras {inn.extras}</div>
            {locked && <p className="mt-1 text-sm text-gold">This innings is complete.</p>}
          </div>
        ) : <p className="mt-4 text-sm text-mist">This innings hasn't started.</p>}
      </Card>

      {inn && (
        <>
          <Card>
            <h3 className="mb-2 text-2xl font-bold">Ball by ball</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {BALLS.map(([label, body]) => (
                <Button key={label} variant={['4', '6'].includes(label) ? 'gold' : 'ghost'} className="!py-3 text-lg" disabled={busy || locked || bowlerRequired || batterRequired || match.status === 'UPCOMING'} onClick={() => run(() => api.scores.ball(matchId, n, { wicket: false, ...body }))}>{label}</Button>
              ))}
              <Button variant="danger" className="!py-3 text-lg" disabled={busy || locked || bowlerRequired || batterRequired || match.status === 'UPCOMING'} onClick={() => run(() => api.scores.ball(matchId, n, { runs: 0, wicket: true }))}>Wicket</Button>
              <Button variant="danger" className="!py-3 text-lg" disabled={busy || locked || bowlerRequired || batterRequired || match.status === 'UPCOMING'} onClick={() => run(() => api.scores.ball(matchId, n, { runs: 0, wicket: true, dismissal: 'STRIKER' }))}>Run out striker</Button>
              <Button variant="danger" className="!py-3 text-lg" disabled={busy || locked || bowlerRequired || batterRequired || match.status === 'UPCOMING'} onClick={() => run(() => api.scores.ball(matchId, n, { runs: 0, wicket: true, dismissal: 'NON_STRIKER' }))}>Run out non-striker</Button>
            </div>
            <p className="mt-2 text-xs text-mist">Wide and no-ball add a run without using a ball. Odd runs and the end of an over swap the batters automatically.</p>
          </Card>
          <Card>
            <h3 className="mb-2 text-2xl font-bold">At the crease</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[['strikerId', 'Striker', batters], ['nonStrikerId', 'Non-striker', batters], ['bowlerId', 'Bowler', bowlers]].map(([key, label, list]) => (
                <Field key={key} label={label}>
                  <select className="input" value={inn[key] ?? ''} onChange={(e) => run(() => api.scores.updateInnings(matchId, n, { [key]: e.target.value || null }))}>
                    <option value="">Not set</option>{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              ))}
            </div>
            {bowlerRequired && <p className="mt-2 rounded-lg bg-gold/10 p-3 text-sm text-gold">Select a bowler to start the over.</p>}
            {batterRequired && <p className="mt-2 rounded-lg bg-gold/10 p-3 text-sm text-gold">Select the replacement batter before recording the next ball.</p>}
          </Card>
          {manual && (
            <Card>
              <h3 className="mb-2 text-2xl font-bold">Correct the score</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[['runs', 'Runs'], ['wickets', 'Wickets'], ['overs', 'Overs (e.g. 12.3)'], ['extras', 'Extras'], ['target', 'Target']].map(([k, l]) => (
                  <Field key={k} label={l}><input className="input" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} /></Field>
                ))}
              </div>
              <Button className="mt-3" variant="ghost" loading={busy} onClick={() => run(() => api.scores.updateInnings(matchId, n, {
                runs: Number(manual.runs), wickets: Number(manual.wickets), overs: String(manual.overs), extras: Number(manual.extras),
                target: manual.target === '' ? null : Number(manual.target), status: locked ? 'IN_PROGRESS' : undefined,
              }))}>Save score</Button>
            </Card>
          )}
        </>
      )}

      <CompleteMatchModal match={completing ? match : null} onClose={() => setCompleting(false)} />
      <Modal open={stats} onClose={() => setStats(false)} title="Player statistics" wide>
        <StatsEditor match={match} players={(squads.data ?? []).filter((p) => [match.teamAId, match.teamBId].includes(p.currentTeamId))} onClose={() => setStats(false)} />
      </Modal>
    </div>
  );
}

export default function AdminScores() {
  const { seasonId, season } = useSeason();
  const [matchId, setMatchId] = useState('');
  const matches = useFetch(() => (seasonId ? api.matches.list(seasonId) : null), [seasonId]);
  if (!seasonId) return <Empty title="No season selected" />;
  const scorable = (matches.data ?? []).filter((m) => ['LIVE', 'COMPLETED'].includes(m.status));
  return (
    <>
      <PageHeader title="Live scoring" subtitle={season?.name} />
      <Async state={matches}>
        {() => scorable.length ? (
          <>
            <div className="mb-4 max-w-md">
              <Field label="Match">
                <select className="input" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                  <option value="">Select a match…</option>
                  {scorable.map((m) => <option key={m.id} value={m.id}>#{m.matchNumber} {m.teamA.name} vs {m.teamB.name} ({m.status.toLowerCase()})</option>)}
                </select>
              </Field>
            </div>
            {matchId ? <Console key={matchId} matchId={matchId} seasonId={seasonId} /> : <Empty title="Pick a match to score" />}
          </>
        ) : <Empty title="No live matches">Start a match from the Matches page, then score it here.</Empty>}
      </Async>
    </>
  );
}
