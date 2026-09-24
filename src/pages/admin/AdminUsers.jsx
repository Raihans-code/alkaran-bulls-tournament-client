import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, errorMessage } from '../../services/api.js';
import { Async, Badge, Button, PageHeader, Table } from '../../components/ui.jsx';
import { dateOnly } from '../../utils/format.js';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const users = useFetch(() => api.admin.users(), []);
  const update = async (u, body, msg) => {
    try { await api.admin.updateUser(u.id, body); toast.success(msg); users.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <>
      <PageHeader title="Users" subtitle="Assign viewer, team owner, or admin access." />
      <Async state={users}>
        {(list) => (
          <Table head={['Name', 'Email', 'Role', 'Teams', 'Joined', 'Scoring', 'Status', '']}>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="td font-semibold">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-pitch">(you)</span>}</td>
                <td className="td text-mist">{u.email}</td>
                <td className="td">{u.role === 'ADMIN' ? <Badge tone="gold">Admin</Badge> : u.role === 'OWNER' ? <Badge tone="green">Owner</Badge> : 'Viewer'}</td>
                <td className="td num">{u.teams}</td>
                <td className="td text-mist">{dateOnly(u.createdAt)}</td>
                <td className="td">{u.canScore ? <Badge tone="green">Can score</Badge> : '-'}</td>
                <td className="td">{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}</td>
                <td className="td"><div className="flex flex-wrap gap-1.5">
                  {u.role !== 'ADMIN' && <Button size="sm" variant="ghost" onClick={() => update(u, { canScore: !u.canScore }, u.canScore ? 'Scoring removed' : 'Scoring granted')}>{u.canScore ? 'Remove scoring' : 'Allow scoring'}</Button>}
                  {u.id !== me.id && <Button size="sm" variant="ghost" onClick={() => update(u, { role: u.role === 'USER' ? 'OWNER' : u.role === 'OWNER' ? 'ADMIN' : 'USER' }, 'Role updated')}>{u.role === 'ADMIN' ? 'Make viewer' : u.role === 'OWNER' ? 'Make admin' : 'Make owner'}</Button>}
                  {u.id !== me.id && <Button size="sm" variant={u.isActive ? 'danger' : 'primary'} onClick={() => update(u, { isActive: !u.isActive }, u.isActive ? 'Account disabled' : 'Account enabled')}>{u.isActive ? 'Disable' : 'Enable'}</Button>}
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
    </>
  );
}
