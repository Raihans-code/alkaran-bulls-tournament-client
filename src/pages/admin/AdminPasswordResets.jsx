import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { api, errorMessage } from '../../services/api.js';
import { Async, Badge, Button, Card, PageHeader, Table, Modal } from '../../components/ui.jsx';
import { dateOnly } from '../../utils/format.js';
import { useState } from 'react';

export default function AdminPasswordResets() {
  const toast = useToast();
  const requests = useFetch(() => api.admin.passwordResetRequests(), []);
  const [temporary, setTemporary] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const approve = async (id) => {
    setBusyId(id);
    try {
      const result = await api.admin.approvePasswordReset(id);
      setTemporary(result);
      toast.success('Password recovery request approved');
      requests.reload();
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setBusyId(null); }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await api.admin.rejectPasswordReset(id);
      toast.success('Password recovery request rejected');
      requests.reload();
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <PageHeader title="Password recovery" subtitle="Review and approve account recovery requests." />
      <Card className="mb-5 border-gold/30">
        <p className="text-sm text-mist"><strong className="text-white">Security:</strong> an approved temporary password is shown once after approval. Copy it and give it to the user through a trusted channel. It is never stored as plaintext.</p>
      </Card>
      <Async state={requests}>
        {(list) => {
          const pending = list.filter((r) => r.status === 'PENDING');
          if (!pending.length) return <Card><p className="text-sm text-mist">No pending password recovery requests.</p></Card>;
          return (
            <Table head={['User', 'Email', 'Reason', 'Requested', 'Status', '']}>
              {pending.map((r) => (
                <tr key={r.id}>
                  <td className="td font-semibold">{r.user.name}</td>
                  <td className="td text-mist">{r.user.email}</td>
                  <td className="td max-w-xs whitespace-normal text-mist">{r.reason || '—'}</td>
                  <td className="td text-mist">{dateOnly(r.createdAt)}</td>
                  <td className="td"><Badge tone="gold">Pending</Badge></td>
                  <td className="td"><div className="flex gap-2">
                    <Button size="sm" loading={busyId === r.id} onClick={() => approve(r.id)}>Approve</Button>
                    <Button size="sm" variant="danger" disabled={busyId === r.id} onClick={() => reject(r.id)}>Reject</Button>
                  </div></td>
                </tr>
              ))}
            </Table>
          );
        }}
      </Async>

      <Modal open={!!temporary} onClose={() => setTemporary(null)} title="Temporary password">
        {temporary && <div className="space-y-4">
          <p className="text-sm text-mist">Give this temporary password to <strong className="text-white">{temporary.user.name}</strong> ({temporary.user.email}). This value is shown only once in this screen.</p>
          <div className="rounded-xl border border-pitch/30 bg-ink-950 p-4">
            <code className="block break-all text-lg font-bold text-pitch">{temporary.temporaryPassword}</code>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(temporary.temporaryPassword)}>Copy</Button>
            <Button onClick={() => setTemporary(null)}>Done</Button>
          </div>
        </div>}
      </Modal>
    </>
  );
}
