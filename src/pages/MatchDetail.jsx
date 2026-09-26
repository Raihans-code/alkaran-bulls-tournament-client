import { Link, useParams } from 'react-router-dom';
import { useLiveMatch } from '../hooks/useLiveMatch.js';
import { Card, ErrorState, PageHeader, Spinner, StatusBadge, Table } from '../components/ui.jsx';
import { InningsLine, inningsFor } from '../components/ScoreCard.jsx';
import { dateTime } from '../utils/format.js';

export default function MatchDetail() {
  const { matchId } = useParams();
  const { match, error } = useLiveMatch(matchId);
  if (error && !match) return <ErrorState message="Match not found" />;
  if (!match) return <div className="grid place-items-center py-16"><Spinner /></div>;

  const teamName = (id) => (id === match.teamAId ? match.teamA.name : match.teamB.name);
  const rows = match.stats ?? [];
  return (
    <>
      <PageHeader
        title={`${match.teamA.name} vs ${match.teamB.name}`}
        subtitle={<>Match {match.matchNumber} • {match.venue ?? 'Venue TBA'} • {dateTime(match.scheduledAt)} <span className="ml-2"><StatusBadge status={match.status} /></span></>}
        actions={<Link to={`/scoreboard/${match.id}`} className="btn-primary btn-sm">Big scoreboard</Link>}
      />
      <Card>
        <div className="space-y-2">
          <InningsLine innings={inningsFor(match, match.teamAId)} teamName={match.teamA.name} />
          <InningsLine innings={inningsFor(match, match.teamBId)} teamName={match.teamB.name} />
        </div>
        {match.status === 'COMPLETED' && (
          <div className="mt-4 border-t border-ink-line pt-3">
            <div className="font-display text-2xl font-bold text-gold">{match.resultText}</div>
            {match.playerOfMatch && <div className="text-sm text-mist">Player of the match: <b className="text-white">{match.playerOfMatch.name}</b></div>}
          </div>
        )}
      </Card>
      <h2 className="mb-2 mt-6 text-3xl font-bold">Innings</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {match.innings.map((i) => (
          <Card key={i.id}>
            <div className="text-xs text-mist">Innings {i.inningsNumber} • {teamName(i.battingTeamId)} batting</div>
            <div className="num text-4xl font-bold">{i.runs}/{i.wickets} <span className="text-lg font-normal text-mist">({i.overs} ov)</span></div>
            <div className="mt-1 text-sm text-mist">Extras {i.extras}{i.target ? ` • Target ${i.target}` : ''}</div>
          </Card>
        ))}
        {!match.innings.length && <p className="text-sm text-mist">The match hasn't started.</p>}
      </div>
      {rows.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-3xl font-bold">Player statistics</h2>
          <Table head={['Player', 'Runs', 'Balls', '4s', '6s', 'Wkts', 'Overs', 'Conceded']}>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td font-semibold">{r.player.name}</td><td className="td num">{r.runs}</td><td className="td num">{r.ballsFaced}</td>
                <td className="td num">{r.fours}</td><td className="td num">{r.sixes}</td><td className="td num">{r.wickets}</td>
                <td className="td num">{Math.floor(r.ballsBowled / 6)}.{r.ballsBowled % 6}</td><td className="td num">{r.runsConceded}</td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </>
  );
}
