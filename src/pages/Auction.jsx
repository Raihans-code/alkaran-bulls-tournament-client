import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSeason } from '../context/SeasonContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuction } from '../hooks/useAuction.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { api, errorMessage } from '../services/api.js';
import { Avatar, Badge, Button, Card, ConfirmDialog, Empty, Field, PageHeader, Progress, StatusBadge, Table } from '../components/ui.jsx';
import BidList from '../components/BidList.jsx';
import { CATEGORY_LABEL, dateTime, taka } from '../utils/format.js';

function Stage({ state, flash, big }) {
  const a = state?.auction;
  const last = state?.lastResult;
  const pad = big ? 'min-h-[70vh]' : 'min-h-[360px]';

  return (
    <div className={`relative grid ${pad} place-items-center overflow-hidden rounded-2xl border border-ink-line bg-[radial-gradient(circle_at_50%_15%,#164438_0%,#0b1928_50%,#07101a_100%)] p-6 text-center`}>
      {flash && (
        <div className={`absolute inset-x-0 top-0 z-10 py-3 font-display text-3xl font-extrabold tracking-wide ${flash.tone === 'green' ? 'bg-pitch text-ink-950' : 'bg-ink-600 text-white'}`} role="status">{flash.text}</div>
      )}
      {a ? (
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-alert/50 bg-alert/15 px-3 py-1 text-xs font-bold text-red-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-alert" /> LIVE
          </span>
          <div className="mt-4 flex justify-center"><Avatar name={a.player.name} src={a.player.image} size={big ? 150 : 104} /></div>
          <h2 className={`mt-3 break-words font-bold leading-none ${big ? 'text-7xl' : 'text-3xl sm:text-5xl'}`}>{a.player.name}</h2>
          <div className="mt-2 text-mist"><Badge tone="blue">{CATEGORY_LABEL[a.player.category]}</Badge> <span className="ml-2">Base {taka(a.basePrice)}</span></div>
          <div className={`num mt-4 break-words font-extrabold leading-none text-gold ${big ? 'text-[9rem]' : 'text-5xl sm:text-7xl'}`} aria-live="polite">{taka(a.currentBid)}</div>
          <div className="mt-2 text-sm text-mist">Current bid</div>
          <div className={`mt-3 ${big ? 'text-3xl' : 'text-lg'} font-semibold`}>
            {a.highestBidTeam ? <>Highest bidder: <span className="text-pitch">{a.highestBidTeam.name}</span></> : <span className="text-mist">Waiting for the first bid</span>}
          </div>
        </div>
      ) : (
        <div>
          <p className={`font-display font-bold ${big ? 'text-6xl' : 'text-3xl'}`}>Alkaran Bulls Auction</p>
          {last ? (
            <p className="mt-3 text-mist">
              Last player: <b className="text-white">{last.player?.name}</b> {last.status === 'SOLD' ? <>sold to <b className="text-pitch">{last.team?.name}</b> for <b className="text-gold">{taka(last.price)}</b></> : <>marked {last.status.toLowerCase()}</>}
            </p>
          ) : (
            <p className="mt-3 text-mist">The next player will appear here the moment the auctioneer starts the bidding.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPanel({ state, seasonId, players, teams, bid, reloadPlayers }) {
  const toast = useToast();
  const [playerId, setPlayerId] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const live = state?.isLive;
  const pool = useMemo(() => players.filter((p) => ['AVAILABLE', 'UNSOLD'].includes(p.status)), [players]);
  const selectedTeam = teams.find((t) => t.id === teamId);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) toast.success(okMsg); setConfirm(null); setPlayerId(''); reloadPlayers(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const actions = {
    SOLD: { title: 'Mark as SOLD?', msg: state?.auction?.highestBidTeam ? `${state.auction.player.name} goes to ${state.auction.highestBidTeam.name} for ${taka(state.auction.currentBid)}. Their purse is reduced immediately.` : 'There are no bids yet.', label: 'Mark SOLD', fn: () => api.auctions.sold(seasonId), ok: 'Player sold' },
    UNSOLD: { title: 'Mark as UNSOLD?', msg: 'The player returns to the unsold pool and can be auctioned again.', label: 'Mark UNSOLD', fn: () => api.auctions.unsold(seasonId), ok: 'Marked unsold' },
    WITHDRAW: { title: 'Withdraw this player?', msg: 'The player is taken out of the auction. An admin can reset them later.', label: 'Withdraw', fn: () => api.auctions.withdraw(seasonId), ok: 'Player withdrawn' },
    CANCEL: { title: 'Cancel this auction?', msg: 'Bids are kept in the history but the player goes back to available.', label: 'Cancel auction', fn: () => api.auctions.cancel(seasonId), ok: 'Auction cancelled', danger: true },
  };
  const placeBid = async () => {
    if (!selectedTeam || !state?.nextBid || selectedTeam.purse < state.nextBid) return;
    setBusy(true);
    try { await bid(state.nextBid, selectedTeam.id); toast.success(`Bid placed for ${selectedTeam.name}`); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Card>
      <h3 className="text-2xl font-bold">Auctioneer</h3>
      {state && state.seasonStatus !== 'AUCTION' && <p className="mt-2 rounded-lg bg-gold/10 p-3 text-sm text-gold">Season is {state.seasonStatus.toLowerCase()}. Move it to the Auction stage in Seasons to start bidding.</p>}
      {!live ? (
        <div className="mt-3 space-y-3">
          <Field label="Player" hint={`${pool.length} available to auction`}>
            <select className="input" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">Select player…</option>
              {pool.map((p) => <option key={p.id} value={p.id}>{p.name} | {CATEGORY_LABEL[p.category] ?? p.category} | Base {taka(p.basePrice)}{p.status === 'UNSOLD' ? ' (unsold)' : ''}</option>)}
            </select>
          </Field>
          <Button className="w-full" disabled={!playerId} loading={busy} onClick={() => run(() => api.auctions.start({ seasonId, playerId }), 'Auction started')}>Start auction</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-ink-700 p-3"><div className="text-xs text-mist">Next valid bid</div><div className="num text-xl font-bold">{taka(state.nextBid)}</div></div>
            <div className="rounded-lg bg-ink-700 p-3"><div className="text-xs text-mist">Increment</div><div className="num text-xl font-bold">{taka(state.bidIncrement)}</div></div>
          </div>
          <Field label="Bid on behalf of">
            <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Select approved team…</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name} • {taka(t.purse)} purse</option>)}
            </select>
          </Field>
          <Button variant="gold" className="w-full" disabled={!selectedTeam || selectedTeam.purse < state.nextBid} loading={busy} onClick={placeBid}>
            {!selectedTeam ? 'Select a team' : selectedTeam.purse < state.nextBid ? 'Insufficient purse' : `BID ${taka(state.nextBid)} for ${selectedTeam.name}`}
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="gold" onClick={() => setConfirm('SOLD')} disabled={!state.auction.highestBidTeam}>SOLD</Button>
            <Button variant="ghost" onClick={() => setConfirm('UNSOLD')}>UNSOLD</Button>
            <Button variant="ghost" onClick={() => setConfirm('WITHDRAW')}>WITHDRAW</Button>
          </div>
          <Button variant="danger" size="sm" className="w-full" onClick={() => setConfirm('CANCEL')}>Cancel auction</Button>
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        title={confirm && actions[confirm].title}
        message={confirm && actions[confirm].msg}
        confirmLabel={confirm && actions[confirm].label}
        danger={confirm && actions[confirm].danger}
        loading={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => run(actions[confirm].fn, actions[confirm].ok)}
      />
    </Card>
  );
}

function OwnerPanel({ state, myTeams, bid, user }) {
  const toast = useToast();
  const [teamId, setTeamId] = useState(myTeams[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const team = myTeams.find((t) => t.id === teamId) ?? myTeams[0];
  const a = state?.auction;

  if (!user) return <Card><Empty title="Sign in to bid">Anyone can watch the auction. Sign in to register a team and place bids.</Empty></Card>;
  if (!team) return <Card><Empty title="No approved team yet">You can bid once an admin approves your team for this season.</Empty></Card>;

  const full = team.squadFull;
  const isHighest = a?.highestBidTeam?.id === team.id;
  const step = state?.bidIncrement ?? 0;
  const place = async (amount) => {
    if (busy) return; // guards against rapid double-clicks; the server also rejects duplicates
    setBusy(true);
    try { await bid(amount, team.id); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const next = state?.nextBid;
  const can = (amt) => a && !full && !isHighest && team.purse >= amt && !busy;
  const bidAmount = (option) => (a ? a.currentBid + option : null);

  return (
    <Card>
      <h3 className="text-2xl font-bold">My bid</h3>
      {myTeams.length > 1 && (
        <select className="input mt-2" value={team.id} onChange={(e) => setTeamId(e.target.value)} aria-label="Bidding team">
          {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      <div className="mt-3 flex items-center gap-3"><Avatar name={team.name} src={team.logo} size={40} /><div className="font-display text-xl font-bold">{team.name}</div></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-ink-700 p-3"><div className="text-xs text-mist">Purse</div><div className="num text-xl font-bold text-gold">{taka(team.purse)}</div></div>
        <div className="rounded-lg bg-ink-700 p-3"><div className="text-xs text-mist">Squad</div><div className="num text-xl font-bold">{team.squadCount} / {team.maxPlayers}</div></div>
      </div>
      <div className="mt-2"><Progress value={team.squadCount} max={team.maxPlayers} tone={full ? 'gold' : 'green'} /></div>
      {full && <p className="mt-3 rounded-lg bg-gold/10 p-3 text-center font-display text-xl font-bold text-gold">SQUAD FULL</p>}
      <div className="mt-4">
        <div className="text-xs text-mist">Next bid</div>
        <div className="num text-3xl font-bold">{a ? taka(next) : '-'}</div>
        <Button variant="gold" className="mt-2 w-full !py-3 text-base" disabled={!can(next)} loading={busy} onClick={() => place(next)}>
          {!a ? 'Waiting for auction' : full ? 'Squad full' : isHighest ? 'You hold the highest bid' : team.purse < next ? 'Not enough purse' : `BID ${taka(next)}`}
        </Button>
        {a && !full && !isHighest && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(state?.bidOptions ?? [step, step * 2, step * 5]).map((option) => {
              const amount = bidAmount(option);
              return <Button key={option} variant="ghost" size="sm" disabled={!can(amount)} onClick={() => place(amount)}>+{taka(option)}</Button>;
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function TeamsStrip({ teams, myTeamIds }) {
  if (!teams?.length) return null;
  return (
    <Card>
      <h3 className="mb-2 text-2xl font-bold">Teams</h3>
      <ul className="divide-y divide-ink-line text-sm">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 py-2">
            <span className="truncate">{t.name}{myTeamIds.includes(t.id) && <span className="ml-1 text-pitch">(you)</span>}</span>
            <span className="flex items-center gap-3">
              <span className={`num ${t.squadFull ? 'text-gold' : 'text-mist'}`}>{t.squadCount}/{t.maxPlayers}{t.squadFull ? ' full' : ''}</span>
              <span className="num w-20 text-right font-semibold text-gold">{taka(t.purse)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BigScreen({ state, flash, teams, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { window.removeEventListener('keydown', onKey); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-ink-950 p-4">
      <div className="mx-auto grid max-w-[1800px] gap-4 lg:grid-cols-[1fr_420px]">
        <Stage state={state} flash={flash} big />
        <div className="space-y-4">
          <Card><h3 className="mb-2 text-3xl font-bold">Recent bids</h3><BidList bids={state?.auction?.bids} limit={6} /></Card>
          <TeamsStrip teams={teams} myTeamIds={[]} />
          <Button variant="ghost" className="w-full" onClick={onClose}>Exit big screen (Esc)</Button>
        </div>
      </div>
    </div>
  );
}

export default function Auction({ admin }) {
  const { user, isAdmin, isOwner } = useAuth();
  const { seasonId, season } = useSeason();
  const { state, connected, lastEvent, bid } = useAuction(seasonId);
  const [big, setBig] = useState(false);
  const [flash, setFlash] = useState(null);
  const showAdmin = admin && isAdmin;

  const teams = useFetch(() => (seasonId ? api.teams.list(seasonId, 'APPROVED') : null), [seasonId]);
  const mine = useFetch(() => (seasonId && isOwner && !isAdmin ? api.teams.mine(seasonId) : null), [seasonId, isOwner, isAdmin]);
  const players = useFetch(() => (seasonId && showAdmin ? api.players.list({ seasonId }) : null), [seasonId, showAdmin]);
  const history = useFetch(() => (seasonId ? api.auctions.history(seasonId) : null), [seasonId]);

  const refreshAll = useCallback(() => { teams.reload(); mine.reload(); players.reload(); history.reload(); }, [teams, mine, players, history]);
  useSocketEvent('teams:update', refreshAll);

  useEffect(() => {
    if (!lastEvent) return undefined;
    const r = lastEvent.result;
    if (lastEvent.event === 'auction:sold' && r) setFlash({ tone: 'green', text: `SOLD! ${r.player.name} → ${r.team.name} for ${taka(r.price)}` });
    else if (lastEvent.event === 'auction:unsold' && r) setFlash({ tone: 'gray', text: `${r.player.name} is UNSOLD` });
    else if (lastEvent.event === 'auction:withdraw' && r) setFlash({ tone: 'gray', text: `${r.player.name} withdrawn` });
    else if (lastEvent.event === 'auction:end') setFlash({ tone: 'gray', text: 'Auction cancelled' });
    if (['auction:sold', 'auction:unsold', 'auction:withdraw', 'auction:end'].includes(lastEvent.event)) {
      history.reload(); players.reload(); teams.reload(); mine.reload();
      const t = setTimeout(() => setFlash(null), 6000);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  const myTeams = (mine.data ?? []).filter((t) => t.registrationStatus === 'APPROVED');
  const myTeamIds = (mine.data ?? []).map((t) => t.id);
  // Live squad counts for my team come from the shared teams list (kept fresh by teams:update).
  const liveMine = myTeams.map((t) => ({ ...t, ...(teams.data?.find((x) => x.id === t.id) ?? {}) }));

  if (!seasonId) return <Empty title="No season selected">Create or pick a season first.</Empty>;

  return (
    <>
      <PageHeader
        title="Live auction"
        subtitle={season?.name}
        actions={<>
          <Badge tone={connected ? 'green' : 'red'}>{connected ? 'Connected' : 'Reconnecting…'}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setBig(true)}>Big screen</Button>
        </>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Stage state={state} flash={flash} />
          <Card>
            <h3 className="mb-1 text-2xl font-bold">Live bidding</h3>
            <BidList bids={state?.auction?.bids} myTeamId={myTeams[0]?.id} limit={10} />
          </Card>
        </div>
        <div className="space-y-4">
          {showAdmin
            ? <AdminPanel state={state} seasonId={seasonId} players={players.data ?? []} teams={teams.data ?? []} bid={bid} reloadPlayers={() => { players.reload(); teams.reload(); }} />
            : <OwnerPanel key={liveMine.map((t) => t.id).join()} state={state} myTeams={liveMine} bid={bid} user={isOwner ? user : null} />}
          <TeamsStrip teams={teams.data} myTeamIds={myTeamIds} />
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-3xl font-bold">Auction history</h2>
      <Table head={['Player', 'Result', 'Team', 'Price', 'Bids', 'Ended']}>
        {(history.data ?? []).map((h) => (
          <tr key={h.id}>
            <td className="td font-semibold">{h.player.name}</td>
            <td className="td"><StatusBadge status={h.status} /></td>
            <td className="td">{h.status === 'SOLD' ? h.highestBidTeam?.name : '-'}</td>
            <td className="td num text-gold">{h.status === 'SOLD' ? taka(h.currentBid) : '-'}</td>
            <td className="td">{h.bids.length}</td>
            <td className="td text-mist">{dateTime(h.endedAt)}</td>
          </tr>
        ))}
        {!history.data?.length && <tr><td className="td text-mist" colSpan={6}>No completed auctions yet.</td></tr>}
      </Table>

      {big && <BigScreen state={state} flash={flash} teams={teams.data} onClose={() => setBig(false)} />}
    </>
  );
}
