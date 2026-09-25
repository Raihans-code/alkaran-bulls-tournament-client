import { useState } from 'react';
import { Button, Field } from './ui.jsx';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function SeasonForm({ initial, onSubmit, submitLabel = 'Save season', busy }) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    seasonNumber: initial?.seasonNumber ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    description: initial?.description ?? '',
    startDate: toDateInput(initial?.startDate),
    endDate: toDateInput(initial?.endDate),
    maxTeams: initial?.maxTeams ?? 10,
    maxPlayersPerTeam: initial?.maxPlayersPerTeam ?? 8,
    initialTeamBudget: initial?.initialTeamBudget ?? 10000,
    bidIncrement: initial?.bidIncrement ?? 100,
    bidOptions: initial?.bidOptions?.length === 4 ? initial.bidOptions : [100, 300, 500, 1000],
    allowMultipleTeamsPerUser: initial?.allowMultipleTeamsPerUser ?? false,
    winPoints: initial?.winPoints ?? 2,
    tiePoints: initial?.tiePoints ?? 1,
    noResultPoints: initial?.noResultPoints ?? 1,
    lossPoints: initial?.lossPoints ?? 0,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setBidOption = (index) => (e) => setF({ ...f, bidOptions: f.bidOptions.map((value, i) => i === index ? e.target.value : value) });
  const num = (k, label, hint, min = 0) => (
    <Field label={label} hint={hint}><input className="input" type="number" min={min} required value={f[k]} onChange={set(k)} /></Field>
  );

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...f,
      seasonNumber: Number(f.seasonNumber),
      year: Number(f.year),
      bidOptions: f.bidOptions.map(Number),
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      description: f.description || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><Field label="Season name"><input className="input" required value={f.name} onChange={set('name')} placeholder="Alkaran Bulls Season 4" /></Field></div>
        {num('seasonNumber', 'Season number', null, 1)}
        {num('year', 'Year', null, 2000)}
        <Field label="Start date"><input className="input" type="date" value={f.startDate} onChange={set('startDate')} /></Field>
        <Field label="End date"><input className="input" type="date" value={f.endDate} onChange={set('endDate')} /></Field>
      </div>
      <Field label="Description"><textarea className="input" rows={2} value={f.description} onChange={set('description')} /></Field>

      <fieldset className="rounded-lg border border-ink-line p-3">
        <legend className="px-1 text-sm font-semibold">Auction rules</legend>
        <div className="grid gap-3 sm:grid-cols-4">
          {num('maxTeams', 'Max teams', null, 2)}
          {num('maxPlayersPerTeam', 'Players per team', 'Default 8, enforced by the server', 1)}
          {num('initialTeamBudget', 'Team purse (৳)')}
        </div>
        <div className="mt-3">
          <div className="mb-2 text-sm font-semibold">Bid options (৳ added per bid)</div>
          <div className="grid gap-3 sm:grid-cols-4">
            {f.bidOptions.map((value, index) => (
              <Field key={index} label={`Option ${index + 1}`}><input className="input" type="number" min={1} required value={value} onChange={setBidOption(index)} /></Field>
            ))}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allowMultipleTeamsPerUser} onChange={set('allowMultipleTeamsPerUser')} /> Allow one user to register more than one team</label>
      </fieldset>

      <fieldset className="rounded-lg border border-ink-line p-3">
        <legend className="px-1 text-sm font-semibold">Points table rules</legend>
        <div className="grid gap-3 sm:grid-cols-4">
          {num('winPoints', 'Win')}{num('tiePoints', 'Tie')}{num('noResultPoints', 'No result')}{num('lossPoints', 'Loss')}
        </div>
      </fieldset>
      <Button type="submit" loading={busy}>{submitLabel}</Button>
    </form>
  );
}
