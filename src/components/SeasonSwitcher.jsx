import { useSeason } from '../context/SeasonContext.jsx';

export default function SeasonSwitcher({ className = '' }) {
  const { seasons, seasonId, setSeasonId } = useSeason();
  if (!seasons.length) return null;
  return (
    <select aria-label="Season" value={seasonId ?? ''} onChange={(e) => setSeasonId(e.target.value)} className={`input !w-auto max-w-[190px] py-1.5 ${className}`}>
      {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );
}
