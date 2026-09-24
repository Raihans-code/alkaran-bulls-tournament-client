import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, errorMessage } from '../../services/api.js';
import { Button, Card, Empty, Modal, PageHeader, StatusBadge } from '../../components/ui.jsx';
import SeasonForm from '../../components/SeasonForm.jsx';

export default function AdminSeasons() {
  const { seasons, refresh, setSeasonId } = useSeason();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = (seasons[0]?.seasonNumber ?? 0) + 1;

  const create = async (body) => {
    setBusy(true);
    try {
      const s = await api.seasons.create(body);
      toast.success(`${s.name} created`);
      await refresh(); setSeasonId(s.id); setOpen(false);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Seasons" subtitle="Create a season, then walk it through registration, auction and matches." actions={<Button onClick={() => setOpen(true)}>Create season</Button>} />
      {!seasons.length && <Empty title="No seasons yet" action={<Button onClick={() => setOpen(true)}>Create season</Button>} />}
      <div className="grid gap-3 md:grid-cols-2">
        {seasons.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div><div className="font-display text-2xl font-bold">{s.name}</div><div className="text-xs text-mist">Season {s.seasonNumber} • {s.year} • max {s.maxTeams} teams, {s.maxPlayersPerTeam} players each</div></div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/admin/seasons/${s.id}`} className="btn-primary btn-sm" onClick={() => setSeasonId(s.id)}>Manage</Link>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create season" wide>
        <SeasonForm initial={{ seasonNumber: next, name: `Alkaran Bulls Season ${next}` }} onSubmit={create} busy={busy} submitLabel="Create season" />
      </Modal>
    </>
  );
}
