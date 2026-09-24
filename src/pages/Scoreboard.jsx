import { Link, useParams } from 'react-router-dom';
import { useLiveMatch } from '../hooks/useLiveMatch.js';
import { Badge, ErrorState, Spinner } from '../components/ui.jsx';

export default function Scoreboard() {
  const { matchId } = useParams();
  const { match, error } = useLiveMatch(matchId);
  if (error && !match) return <ErrorState message="Match not found" />;
  if (!match) return <div className="grid place-items-center py-16"><Spinner /></div>;

  const current = [...match.innings].reverse().find((i) => i.status !== 'NOT_STARTED') ?? match.innings[0];
  const name = (id) => (id === match.teamAId ? match.teamA.name : match.teamB.name);
  const first = match.innings.find((i) => i.inningsNumber === 1);
  const chasing = current?.inningsNumber === 2 && current.target;
  const ballsLeft = current ? match.oversLimit * 6 - current.balls : 0;
  const need = chasing ? current.target - current.runs : 0;
  const rrr = chasing && ballsLeft > 0 ? ((need / ballsLeft) * 6).toFixed(2) : null;
  const crr = current?.balls ? ((current.runs / current.balls) * 6).toFixed(2) : '0.00';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link to={`/matches/${match.id}`} className="text-sm text-mist hover:text-white">← Match details</Link>
        {match.status === 'LIVE' ? <Badge tone="red">● LIVE</Badge> : <Badge>{match.status}</Badge>}
      </div>
      <div className="rounded-2xl border border-ink-line bg-[radial-gradient(circle_at_50%_0%,#164438_0%,#0b1928_55%,#07101a_100%)] p-6 text-center sm:p-10">
        <div className="text-sm text-mist">Match {match.matchNumber} • {match.oversLimit} overs</div>
        {current ? (
          <>
            <div className="mt-3 font-display text-3xl font-bold sm:text-5xl">{name(current.battingTeamId)}</div>
            <div className="num text-[clamp(5rem,20vw,11rem)] font-extrabold leading-none text-gold" aria-live="polite">{current.runs}/{current.wickets}</div>
            <div className="num text-3xl text-mist sm:text-4xl">{current.overs} overs</div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-1 text-lg">
              <span>CRR <b className="num">{crr}</b></span>
              {rrr && <span>RRR <b className="num text-gold">{rrr}</b></span>}
              <span>Extras <b className="num">{current.extras}</b></span>
            </div>
            {chasing && match.status === 'LIVE' && <div className="mt-3 text-xl font-semibold text-pitch">Target {current.target}. Need {Math.max(0, need)} from {Math.max(0, ballsLeft)} balls</div>}
            {!chasing && first && current.inningsNumber === 1 && <div className="mt-3 text-mist">First innings</div>}
            <div className="mx-auto mt-6 grid max-w-xl gap-3 text-left sm:grid-cols-3">
              {[['Striker', current.striker], ['Non-striker', current.nonStriker], ['Bowler', current.bowler]].map(([label, p]) => (
                <div key={label} className="rounded-lg bg-ink-800/80 p-3"><div className="text-xs text-mist">{label}</div><div className="font-semibold">{p?.name ?? '-'}</div></div>
              ))}
            </div>
          </>
        ) : <p className="mt-6 text-mist">{match.teamA.name} vs {match.teamB.name}. Waiting for the toss.</p>}
        {first && current?.inningsNumber === 2 && <div className="mt-6 text-mist">{name(first.battingTeamId)} scored {first.runs}/{first.wickets} ({first.overs} ov)</div>}
        {match.status === 'COMPLETED' && <div className="mt-6 font-display text-3xl font-bold text-pitch">{match.resultText}</div>}
      </div>
    </div>
  );
}
