import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Async, Button, ConfirmDialog, Empty, Field, Modal, PageHeader } from '../components/ui.jsx';
import MatchCard from '../components/ScoreCard.jsx';
import CompleteMatchModal from '../components/CompleteMatchModal.jsx';

function CreateMatchForm({ teams, onSubmit, busy }) {
  const [f, setF] = useState({ teamAId: '', teamBId: '', venue: '', scheduledAt: '', oversLimit: 10 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, oversLimit: Number(f.oversLimit), scheduledAt: f.scheduledAt ? new Date(f.scheduledAt).toISOString() : null, venue: f.venue || null }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Team A"><select className="input" required value={f.teamAId} onChange={set('teamAId')}><option value="">Select…</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Team B"><select className="input" required value={f.teamBId} onChange={set('teamBId')}><option value="">Select…</option>{teams.filter((t) => t.id !== f.teamAId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      </div>
      <Field label="Venue"><input className="input" value={f.venue} onChange={set('venue')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date and time"><input className="input" type="datetime-local" value={f.scheduledAt} onChange={set('scheduledAt')} /></Field>
        <Field label="Overs per innings"><input className="input" type="number" min={1} max={50} value={f.oversLimit} onChange={set('oversLimit')} /></Field>
      </div>
      <Button type="submit" loading={busy}>Create match</Button>
    </form>
  );
}

export default function Matches({ admin }) {
  const { seasonId, season } = useSeason();
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const matches = useFetch(() => (seasonId ? api.matches.list(seasonId) : null), [seasonId]);
  const teams = useFetch(() => (seasonId && admin ? api.teams.list(seasonId, 'APPROVED') : null), [seasonId, admin]);
  useSocketEvent(['score:update', 'match:list'], () => matches.reload());

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); setModal(null); matches.reload(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  if (!seasonId) return <Empty title="No season selected" />;

  const section = (label, list, empty) => (
    <section className="mb-8">
      <h2 className="mb-3 text-3xl font-bold">{label}</h2>
      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <div key={m.id} className="min-w-0">
              <MatchCard match={m} />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.status === 'LIVE' && <Link to={`/scoreboard/${m.id}`} className="btn-ghost btn-sm">Live scoreboard</Link>}
                {admin && m.status === 'UPCOMING' && <>
                  <Button size="sm" onClick={() => setModal({ type: 'start', match: m, batting: m.teamAId })}>Start match</Button>
                  <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'abandon', match: m })}>Abandon</Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', match: m })}>Delete</Button>
                </>}
                {admin && m.status === 'LIVE' && <>
                  <Button size="sm" variant="gold" onClick={() => setModal({ type: 'complete', match: m })}>Complete</Button>
                  <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'abandon', match: m })}>Abandon</Button>
                </>}
                {admin && m.status === 'COMPLETED' && <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'complete', match: m })}>Correct result</Button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-mist">{empty}</p>}
    </section>
  );

  return (
    <>
      <PageHeader title="Matches" subtitle={season?.name} actions={admin && <Button size="sm" onClick={() => setModal({ type: 'create' })}>Create match</Button>} />
      <Async state={matches}>
        {(all) => {
          const list = all ?? [];
          return (
          <>
            {section('Live now', list.filter((m) => m.status === 'LIVE'), 'No match is live.')}
            {section('Upcoming', list.filter((m) => m.status === 'UPCOMING'), 'No upcoming matches.')}
            {section('Results', list.filter((m) => ['COMPLETED', 'ABANDONED'].includes(m.status)).reverse(), 'No results yet.')}
          </>
          );
        }}
      </Async>

      <Modal open={modal?.type === 'create'} onClose={() => setModal(null)} title="Create match">
        <CreateMatchForm teams={teams.data ?? []} busy={busy} onSubmit={(b) => act(() => api.matches.create({ ...b, seasonId }), 'Match created')} />
      </Modal>
      <Modal open={modal?.type === 'start'} onClose={() => setModal(null)} title="Start match">
        {modal?.type === 'start' && (
          <div className="space-y-3">
            <Field label="Who bats first?">
              <select className="input" value={modal.batting} onChange={(e) => setModal({ ...modal, batting: e.target.value })}>
                <option value={modal.match.teamAId}>{modal.match.teamA.name}</option>
                <option value={modal.match.teamBId}>{modal.match.teamB.name}</option>
              </select>
            </Field>
            <Button loading={busy} onClick={() => act(() => api.matches.start(modal.match.id, { battingTeamId: modal.batting }), 'Match is live')}>Go live</Button>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={modal?.type === 'abandon'} title="Abandon match?" message="An abandoned match is excluded from the points table." confirmLabel="Abandon" danger loading={busy} onClose={() => setModal(null)} onConfirm={() => act(() => api.matches.update(modal.match.id, { status: 'ABANDONED' }), 'Match abandoned')} />
      <ConfirmDialog open={modal?.type === 'delete'} title="Delete match?" message="Only upcoming matches can be deleted." confirmLabel="Delete" danger loading={busy} onClose={() => setModal(null)} onConfirm={() => act(() => api.matches.remove(modal.match.id), 'Match deleted')} />
      <CompleteMatchModal match={modal?.type === 'complete' ? modal.match : null} onClose={() => setModal(null)} onDone={matches.reload} />
    </>
  );
}
