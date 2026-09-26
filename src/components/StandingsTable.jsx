import { Table } from './ui.jsx';
import { nrr } from '../utils/format.js';

export default function StandingsTable({ rows, highlightTeamIds = [], compact }) {
  const head = compact ? ['#', 'Team', 'P', 'W', 'L', 'Pts', 'NRR'] : ['Pos', 'Team', 'P', 'W', 'L', 'T', 'NR', 'Pts', 'Runs for', 'Runs against', 'NRR'];
  return (
    <Table head={head} minWidth={compact ? '460px' : '780px'}>
      {rows.map((r) => (
        <tr key={r.id} className={highlightTeamIds.includes(r.teamId) ? 'bg-pitch/10' : ''}>
          <td className="td num font-bold">{r.position}</td>
          <td className="td max-w-[180px] font-semibold">
            <span className="block truncate" title={r.team.name}>{r.team.name}</span>
          </td>
          <td className="td num">{r.played}</td><td className="td num">{r.won}</td><td className="td num">{r.lost}</td>
          {!compact && <><td className="td num">{r.tied}</td><td className="td num">{r.noResult}</td></>}
          <td className="td num text-lg font-bold text-gold">{r.points}</td>
          {!compact && <><td className="td num">{r.runsFor}/{Math.floor(r.ballsFaced / 6)}.{r.ballsFaced % 6}</td><td className="td num">{r.runsAgainst}/{Math.floor(r.ballsBowled / 6)}.{r.ballsBowled % 6}</td></>}
          <td className="td num">{nrr(r.netRunRate)}</td>
        </tr>
      ))}
      {!rows.length && <tr><td className="td text-mist" colSpan={head.length}>No approved teams yet.</td></tr>}
    </Table>
  );
}
