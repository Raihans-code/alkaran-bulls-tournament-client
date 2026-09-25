import { useState } from 'react';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Async, Avatar, Button, Card, Empty, Field, Modal, PageHeader, Progress, Spinner, StatusBadge } from '../components/ui.jsx';
import { CATEGORY_LABEL, taka } from '../utils/format.js';

function TeamForm({ initial, onSubmit, busy, label }) {
  const [f, setF] = useState({ name: initial?.name ?? '', logo: initial?.logo ?? '', contactInfo: initial?.contactInfo ?? '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name: f.name, logo: f.logo || null, contactInfo: f.contactInfo || null }); }} className="space-y-3">
      <Field label="Team name"><input className="input" required minLength={2} maxLength={60} value={f.name} onChange={set('name')} /></Field>
      <Field label="Logo URL (optional)"><input className="input" type="url" value={f.logo} onChange={set('logo')} placeholder="https://…" /></Field>
      <Field label="Contact information"><input className="input" value={f.contactInfo} onChange={set('contactInfo')} placeholder="Phone or email for the organisers" /></Field>
      <Button type="submit" loading={busy}>{label}</Button>
    </form>
  );
}

export default function MyTeam() {
  const { season, seasonId } = useSeason();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = useFetch(() => (seasonId ? api.teams.mine(seasonId) : null), [seasonId]);
  const team = mine.data?.[0];
  const detail = useFetch(() => (team ? api.teams.get(team.id) : null), [team?.id]);
  useSocketEvent('teams:update', () => { mine.reload(); detail.reload(); });

  if (!season) return <Empty title="No season selected" />;

  const register = async (body) => {
    setBusy(true);
    try { await api.teams.register({ ...body, seasonId }); toast.success('Team registered. Waiting for admin approval.'); mine.reload(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const update = async (body) => {
    setBusy(true);
    try { await api.teams.update(team.id, body); toast.success('Team updated'); setEditing(false); mine.reload(); detail.reload(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="My team" subtitle={season.name} />
      <Async state={mine}>
        {() => !team ? (
          season.status === 'REGISTRATION' ? (
            <Card className="max-w-xl">
              <h2 className="mb-1 text-2xl font-bold">Register your team</h2>
              <p className="mb-4 text-sm text-mist">One team per season. An admin approves it before the auction. Starting purse: {taka(season.initialTeamBudget)}.</p>
              <TeamForm onSubmit={register} busy={busy} label="Register team" />
            </Card>
          ) : <Empty title="Registration is closed">This season is {season.status.toLowerCase()}. Pick another season from the switcher to join.</Empty>
        ) : (
          <>
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={team.name} src={team.logo} size={64} />
                <div className="mr-auto">
                  <div className="font-display text-4xl font-bold leading-none">{team.name}</div>
                  <div className="mt-1"><StatusBadge status={team.registrationStatus} /></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit team</Button>
              </div>
              {team.registrationStatus === 'PENDING' && <p className="mt-3 rounded-lg bg-gold/10 p-3 text-sm text-gold">Waiting for approval. You'll be able to bid once an admin approves your team.</p>}
              {team.registrationStatus === 'REJECTED' && <p className="mt-3 rounded-lg bg-alert/10 p-3 text-sm text-red-200">This registration was rejected. Contact the organisers.</p>}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div><div className="text-xs text-mist">Purse left</div><div className="num text-2xl font-bold text-gold">{taka(team.purse)}</div></div>
                <div><div className="text-xs text-mist">Spent</div><div className="num text-2xl font-bold">{taka(team.totalSpent)}</div></div>
                <div><div className="text-xs text-mist">Squad</div><div className="num text-2xl font-bold">{team.squadCount} / {team.maxPlayers}</div></div>
              </div>
              <div className="mt-3"><Progress value={team.squadCount} max={team.maxPlayers} tone={team.squadFull ? 'gold' : 'green'} /></div>
              {team.squadFull && <p className="mt-2 font-display text-lg font-bold text-gold">SQUAD FULL</p>}
            </Card>

            <h2 className="mb-2 mt-6 text-3xl font-bold">Squad</h2>
            <Async state={detail}>
              {(d) => !d ? <div className="grid place-items-center py-8"><Spinner /></div> : (
                <ol className="grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: d.maxPlayers }, (_, i) => d.squad[i]).map((s, i) => (
                    <li key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${s ? 'border-ink-line bg-ink-800' : 'border-dashed border-ink-line text-mist'}`}>
                      <span className="num w-6 text-lg text-mist">{i + 1}</span>
                      {s ? <>
                        <Avatar name={s.player.name} src={s.player.image} size={32} />
                        <div className="mr-auto"><div className="font-semibold">{s.player.name}</div><div className="text-xs text-mist">{CATEGORY_LABEL[s.player.category]}</div></div>
                        <span className="num text-gold">{taka(s.price)}</span>
                      </> : <span className="text-sm">Open slot</span>}
                    </li>
                  ))}
                </ol>
              )}
            </Async>
          </>
        )}
      </Async>
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit team">
        {team && <TeamForm initial={team} onSubmit={update} busy={busy} label="Save changes" />}
      </Modal>
    </>
  );
}
