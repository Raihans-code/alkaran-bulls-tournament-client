import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, errorMessage } from '../services/api.js';
import { Async, Button, Card, ConfirmDialog, PageHeader, StatusBadge } from '../components/ui.jsx';
import SeasonForm from '../components/SeasonForm.jsx';
import SeasonStats from '../components/SeasonStats.jsx';
import TeamCard from '../components/TeamCard.jsx';
import { dateOnly } from '../utils/format.js';

export const NEXT_STATUS = {
  UPCOMING: [['REGISTRATION', 'Open registration'], ['CANCELLED', 'Cancel season']],
  REGISTRATION: [['AUCTION', 'Start auction stage'], ['UPCOMING', 'Back to upcoming'], ['CANCELLED', 'Cancel season']],
  AUCTION: [['RUNNING', 'Start tournament'], ['REGISTRATION', 'Re-open registration'], ['CANCELLED', 'Cancel season']],
  RUNNING: [['COMPLETED', 'Complete season'], ['AUCTION', 'Back to auction'], ['CANCELLED', 'Cancel season']],
  COMPLETED: [['RUNNING', 'Re-open for corrections']],
  CANCELLED: [['UPCOMING', 'Restore season']],
};

export function SeasonAdminPanel({ season, onChanged }) {
  const toast = useToast();
  const { refresh } = useSeason();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const changeStatus = async (status) => {
    setBusy(true);
    try { await api.seasons.setStatus(season.id, { status }); toast.success(`Season is now ${status.toLowerCase()}`); setConfirm(null); await refresh(); onChanged?.(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const save = async (body) => {
    setBusy(true);
    try { await api.seasons.update(season.id, body); toast.success('Season saved'); await refresh(); onChanged?.(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 text-2xl font-bold">Season stage</h2>
        <p className="mb-3 text-sm text-mist">Currently <StatusBadge status={season.status} />. Each stage unlocks the next part of the workflow.</p>
        <div className="flex flex-wrap gap-2">
          {NEXT_STATUS[season.status].map(([s, label]) => (
            <Button key={s} variant={s === 'CANCELLED' ? 'danger' : 'ghost'} size="sm" onClick={() => setConfirm([s, label])}>{label}</Button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-2xl font-bold">Settings</h2>
        <SeasonForm key={season.updatedAt} initial={season} onSubmit={save} busy={busy} submitLabel="Save settings" />
        <p className="mt-2 text-xs text-mist">Changing the team purse only affects teams registered afterwards. Adjust existing teams from Teams.</p>
      </Card>
      <ConfirmDialog open={!!confirm} title={confirm?.[1]} message={`Move ${season.name} to ${confirm?.[0]?.toLowerCase()}?`} loading={busy} danger={confirm?.[0] === 'CANCELLED'} onClose={() => setConfirm(null)} onConfirm={() => changeStatus(confirm[0])} />
    </div>
  );
}

export default function SeasonDetail({ admin }) {
  const { seasonId } = useParams();
  const season = useFetch(() => api.seasons.get(seasonId), [seasonId]);
  const teams = useFetch(() => api.teams.list(seasonId, 'APPROVED'), [seasonId]);

  return (
    <Async state={season}>
      {(s) => (
        <>
          <PageHeader
            title={s.name}
            subtitle={<>Season {s.seasonNumber} • {s.year} • {dateOnly(s.startDate)} to {dateOnly(s.endDate)} <span className="ml-2"><StatusBadge status={s.status} /></span></>}
            actions={<Link to="/seasons" className="btn-ghost btn-sm">All seasons</Link>}
          />
          {s.description && <p className="mb-4 max-w-2xl text-mist">{s.description}</p>}
          {s.champion && (
            <Card className="mb-4 border-gold/60">
              <div className="text-xs text-gold">Champions</div>
              <div className="font-display text-4xl font-bold text-gold">{s.champion.name}</div>
            </Card>
          )}
          {admin && <div className="mb-8"><SeasonAdminPanel season={s} onChanged={() => { season.reload(); teams.reload(); }} /></div>}
          <h2 className="mb-2 text-3xl font-bold">Teams</h2>
          <Async state={teams}>
            {(list) => <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TeamCard key={t.id} team={t} />)}{!list.length && <p className="text-sm text-mist">No approved teams yet.</p>}</div>}
          </Async>
          <h2 className="mb-2 text-3xl font-bold">Season statistics</h2>
          <SeasonStats seasonId={s.id} />
        </>
      )}
    </Async>
  );
}
