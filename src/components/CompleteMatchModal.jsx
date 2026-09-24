import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { api, errorMessage } from '../services/api.js';
import { Button, Field, Modal } from './ui.jsx';

export default function CompleteMatchModal({ match, onClose, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState('AUTO');
  const [pom, setPom] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const players = useFetch(() => (match ? api.players.list({ seasonId: match.seasonId, status: 'SOLD' }) : null), [match?.id]);
  const pool = (players.data ?? []).filter((p) => [match?.teamAId, match?.teamBId].includes(p.currentTeamId));

  const submit = async () => {
    const body = { playerOfMatchId: pom || null, ...(text ? { resultText: text } : {}) };
    if (mode === 'A') Object.assign(body, { resultType: 'WIN', winnerId: match.teamAId });
    if (mode === 'B') Object.assign(body, { resultType: 'WIN', winnerId: match.teamBId });
    if (mode === 'TIE') body.resultType = 'TIE';
    if (mode === 'NR') body.resultType = 'NO_RESULT';
    setBusy(true);
    try { await api.matches.complete(match.id, body); toast.success('Match completed. Points table updated.'); onDone?.(); onClose(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open={!!match} onClose={onClose} title={`Complete match ${match?.matchNumber ?? ''}`}>
      {match && (
        <div className="space-y-3">
          <Field label="Result" hint="Automatic works out the winner from both innings.">
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="AUTO">Work it out from the scores</option>
              <option value="A">{match.teamA.name} won</option>
              <option value="B">{match.teamB.name} won</option>
              <option value="TIE">Tie</option>
              <option value="NR">No result</option>
            </select>
          </Field>
          <Field label="Result text (optional)"><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave empty to generate" /></Field>
          <Field label="Player of the match (optional)">
            <select className="input" value={pom} onChange={(e) => setPom(e.target.value)}>
              <option value="">None</option>{pool.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <p className="text-xs text-mist">Completed matches stay in the season record. The points table is recalculated from every completed match.</p>
          <Button loading={busy} onClick={submit}>Complete match</Button>
        </div>
      )}
    </Modal>
  );
}
