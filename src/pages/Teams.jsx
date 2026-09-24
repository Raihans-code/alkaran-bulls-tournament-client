import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Async, Button, Empty, Field, Modal, PageHeader } from '../components/ui.jsx';
import TeamCard from '../components/TeamCard.jsx';
import { taka } from '../utils/format.js';

export default function Teams({ admin }) {
  const { seasonId, season } = useSeason();
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState('ALL');
  const [purseModal, setPurseModal] = useState(null);
  const [purse, setPurse] = useState({ value: 0, reason: '' });
  const [busy, setBusy] = useState(false);
  const teams = useFetch(() => (seasonId ? api.teams.list(seasonId) : null), [seasonId]);
  useSocketEvent('teams:update', () => teams.reload());

  const setReg = async (team, status) => {
    try { await api.teams.setRegistration(team.id, status); toast.success(`${team.name} ${status.toLowerCase()}`); teams.reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const savePurse = async () => {
    setBusy(true);
    try { await api.teams.adjustPurse(purseModal.id, { purse: Number(purse.value), reason: purse.reason || undefined }); toast.success('Purse updated'); setPurseModal(null); teams.reload(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  if (!seasonId) return <Empty title="No season selected" />;

  return (
    <>
      <PageHeader title="Teams" subtitle={`${season?.name} • up to ${season?.maxTeams} teams, ${season?.maxPlayersPerTeam} players each`} />
      <Async state={teams}>
        {(all) => {
          const visible = admin ? all : all.filter((t) => t.registrationStatus === 'APPROVED');
          const shown = filter === 'ALL' ? visible : visible.filter((t) => t.registrationStatus === filter);
          const pending = all.filter((t) => t.registrationStatus === 'PENDING').length;
          return (
            <>
              {admin && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                    <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm ${filter === s ? 'bg-pitch text-ink-950' : 'bg-ink-600 text-mist'}`}>
                      {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}{s === 'PENDING' && pending ? ` (${pending})` : ''}
                    </button>
                  ))}
                </div>
              )}
              {shown.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((t) => (
                    <TeamCard
                      key={t.id}
                      team={t}
                      mine={t.ownerId === user.id}
                      actions={admin && (
                        <>
                          {t.registrationStatus !== 'APPROVED' && <Button size="sm" onClick={() => setReg(t, 'APPROVED')}>Approve</Button>}
                          {t.registrationStatus === 'PENDING' && <Button size="sm" variant="danger" onClick={() => setReg(t, 'REJECTED')}>Reject</Button>}
                          {t.registrationStatus === 'APPROVED' && <Button size="sm" variant="ghost" onClick={() => { setPurseModal(t); setPurse({ value: t.purse, reason: '' }); }}>Adjust purse</Button>}
                        </>
                      )}
                    />
                  ))}
                </div>
              ) : <Empty title="No teams here yet">{admin ? 'Teams appear once owners register while the season is in the registration stage.' : 'Approved teams will show up here.'}</Empty>}
            </>
          );
        }}
      </Async>
      <Modal open={!!purseModal} onClose={() => setPurseModal(null)} title={`Adjust purse: ${purseModal?.name ?? ''}`}>
        <p className="mb-3 text-sm text-mist">Current purse {taka(purseModal?.purse)}. Every change is written to the audit log.</p>
        <div className="space-y-3">
          <Field label="New purse (৳)"><input className="input" type="number" min={0} value={purse.value} onChange={(e) => setPurse({ ...purse, value: e.target.value })} /></Field>
          <Field label="Reason"><input className="input" value={purse.reason} onChange={(e) => setPurse({ ...purse, reason: e.target.value })} /></Field>
          <Button loading={busy} onClick={savePurse}>Save purse</Button>
        </div>
      </Modal>
    </>
  );
}
