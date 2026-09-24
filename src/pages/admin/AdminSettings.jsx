import { useSeason } from '../../context/SeasonContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { api } from '../../services/api.js';
import { Async, Empty, PageHeader } from '../../components/ui.jsx';
import { SeasonAdminPanel } from '../SeasonDetail.jsx';

export default function AdminSettings() {
  const { seasonId, refresh } = useSeason();
  const season = useFetch(() => (seasonId ? api.seasons.get(seasonId) : null), [seasonId]);
  if (!seasonId) return <Empty title="No season selected" />;
  return (
    <>
      <PageHeader title="Tournament settings" subtitle="Purse, bid increment, squad size and points rules for the selected season." />
      <Async state={season}>{(s) => <SeasonAdminPanel season={s} onChanged={() => { season.reload(); refresh(); }} />}</Async>
    </>
  );
}
