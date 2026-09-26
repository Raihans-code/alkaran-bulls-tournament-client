import { useMemo, useRef, useState } from 'react';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Async, Avatar, Button, ConfirmDialog, Empty, Field, Modal, PageHeader, StatusBadge, Table } from '../components/ui.jsx';
import { CATEGORIES, CATEGORY_LABEL, taka, timeOnly } from '../utils/format.js';
import { csvToPlayers } from '../utils/csv.js';

function PlayerForm({ initial, onSubmit, busy }) {
  const [f, setF] = useState({ name: initial?.name ?? '', basePrice: initial?.basePrice ?? 100, category: initial?.category ?? 'NO_CATEGORY', phone: initial?.phone ?? '', image: initial?.image ?? '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const locked = initial && ['IN_AUCTION', 'SOLD'].includes(initial.status);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, basePrice: Number(f.basePrice), phone: f.phone || null, image: f.image || null }); }} className="space-y-3">
      <Field label="Name"><input className="input" required minLength={2} value={f.name} onChange={set('name')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><select className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></Field>
        <Field label="Base price (৳)" hint={locked ? 'Locked while in auction or sold' : null}><input className="input" type="number" min={0} required disabled={locked} value={f.basePrice} onChange={set('basePrice')} /></Field>
      </div>
      <Field label="Phone / contact (optional)"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Profile image URL (optional)"><input className="input" type="url" value={f.image} onChange={set('image')} placeholder="https://…" /></Field>
      <Button type="submit" loading={busy}>{initial ? 'Save player' : 'Add player'}</Button>
    </form>
  );
}

function PlayerHistory({ playerId }) {
  const state = useFetch(() => api.players.get(playerId), [playerId]);
  return (
    <Async state={state}>
      {(p) => (
        <div className="space-y-3">
          <div className="flex items-center gap-3"><Avatar name={p.name} src={p.image} size={48} /><div><div className="font-display text-2xl font-bold">{p.name}</div><div className="text-sm text-mist">{CATEGORY_LABEL[p.category]} • Base {taka(p.basePrice)}</div></div></div>
          {!p.auctions.length && <p className="text-sm text-mist">This player hasn't been auctioned yet.</p>}
          {p.auctions.map((a) => (
            <div key={a.id} className="rounded-lg border border-ink-line p-3">
              <div className="mb-2 flex items-center justify-between text-sm"><StatusBadge status={a.status} /><span className="num text-gold">{a.status === 'SOLD' ? `${a.highestBidTeam?.name} • ${taka(a.currentBid)}` : ''}</span></div>
              <ul className="text-sm">{a.bids.map((b) => <li key={b.id} className="flex justify-between py-0.5"><span>{b.team.name}</span><span className="num">{taka(b.amount)} <span className="text-xs text-mist">{timeOnly(b.createdAt)}</span></span></li>)}</ul>
              {!a.bids.length && <p className="text-xs text-mist">No bids.</p>}
            </div>
          ))}
        </div>
      )}
    </Async>
  );
}

export default function Players({ admin }) {
  const { seasonId, season } = useSeason();
  const toast = useToast();
  const fileRef = useRef(null);
  const [filters, setFilters] = useState({ q: '', status: '', category: '' });
  const [modal, setModal] = useState(null); // {type:'add'|'edit'|'history'|'delete'|'reset', player}
  const [busy, setBusy] = useState(false);
  const params = useMemo(() => ({ seasonId, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }), [seasonId, filters]);
  const list = useFetch(() => (seasonId ? api.players.list(params) : null), [params]);
  useSocketEvent(['teams:update', 'auction:state'], () => list.reload());

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); setModal(null); list.reload(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const players = csvToPlayers(await file.text());
      if (!players.length) return toast.error('No valid rows found in that CSV');
      const res = await api.players.import({ seasonId, players });
      toast.success(`Imported ${res.created} players${res.skipped.length ? `, skipped ${res.skipped.length} duplicates` : ''}`);
      list.reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const onExport = async () => {
    try {
      const blob = await api.players.exportUrl(seasonId);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${season?.name ?? 'players'}.csv`; a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!seasonId) return <Empty title="No season selected" />;
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="Players"
        subtitle={season?.name}
        actions={admin && (
          <>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={onImport} />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current.click()}>Import CSV</Button>
            <Button variant="ghost" size="sm" onClick={onExport}>Export CSV</Button>
            <Button size="sm" onClick={() => setModal({ type: 'add' })}>Add player</Button>
          </>
        )}
      />
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <input className="input" placeholder="Search by name" value={filters.q} onChange={set('q')} aria-label="Search players" />
        <select className="input" value={filters.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select>
        <select className="input" value={filters.status} onChange={set('status')} aria-label="Status"><option value="">All statuses</option>{['AVAILABLE', 'IN_AUCTION', 'SOLD', 'UNSOLD', 'WITHDRAWN'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
      </div>
      <Async state={list}>
        {(players) => players.length ? (
          <Table head={['Player', 'Category', 'Base', 'Status', 'Team', 'Sold for', ...(admin ? ['Actions'] : [])]}>
            {players.map((p) => (
              <tr key={p.id}>
                <td className="td"><button className="flex items-center gap-2 text-left font-semibold hover:text-pitch" onClick={() => setModal({ type: 'history', player: p })}><Avatar name={p.name} src={p.image} size={28} />{p.name}</button></td>
                <td className="td">{CATEGORY_LABEL[p.category]}</td>
                <td className="td num">{taka(p.basePrice)}</td>
                <td className="td"><StatusBadge status={p.status} /></td>
                <td className="td">{p.currentTeam?.name ?? '-'}</td>
                <td className="td num text-gold">{p.soldPrice ? taka(p.soldPrice) : '-'}</td>
                {admin && (
                  <td className="td"><div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'edit', player: p })}>Edit</Button>
                    {['SOLD', 'UNSOLD', 'WITHDRAWN'].includes(p.status) && <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'reset', player: p })}>Reset</Button>}
                    {p.status === 'AVAILABLE' && <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', player: p })}>Delete</Button>}
                  </div></td>
                )}
              </tr>
            ))}
          </Table>
        ) : <Empty title="No players found">{admin ? 'Add players one by one or import a CSV with Name, BasePrice, Category, Phone columns.' : 'Players will appear once the organisers add them.'}</Empty>}
      </Async>

      <Modal open={modal?.type === 'add'} onClose={() => setModal(null)} title="Add player">
        <PlayerForm busy={busy} onSubmit={(b) => act(() => api.players.create({ ...b, seasonId }), 'Player added')} />
      </Modal>
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit player">
        {modal?.type === 'edit' && <PlayerForm initial={modal.player} busy={busy} onSubmit={(b) => act(() => api.players.update(modal.player.id, b), 'Player updated')} />}
      </Modal>
      <Modal open={modal?.type === 'history'} onClose={() => setModal(null)} title="Player history" wide>
        {modal?.type === 'history' && <PlayerHistory playerId={modal.player.id} />}
      </Modal>
      <ConfirmDialog open={modal?.type === 'delete'} danger title="Delete player?" message={`${modal?.player?.name} will be removed from this season.`} confirmLabel="Delete" loading={busy} onClose={() => setModal(null)} onConfirm={() => act(() => api.players.remove(modal.player.id), 'Player deleted')} />
      <ConfirmDialog open={modal?.type === 'reset'} title="Reset player?" message={`${modal?.player?.name} returns to AVAILABLE.${modal?.player?.status === 'SOLD' ? ` ${modal.player.currentTeam?.name} is refunded ${taka(modal.player.soldPrice)} and loses the player.` : ''}`} confirmLabel="Reset player" loading={busy} onClose={() => setModal(null)} onConfirm={() => act(() => api.auctions.resetPlayer(modal.player.id), 'Player reset')} />
    </>
  );
}
