import { useState } from 'react';
import { useSeason } from '../../context/SeasonContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { api } from '../../services/api.js';
import { Async, Button, PageHeader, Table } from '../../components/ui.jsx';
import { dateTime } from '../../utils/format.js';

export default function AdminAudit() {
  const { seasonId } = useSeason();
  const [page, setPage] = useState(1);
  const [thisSeason, setThisSeason] = useState(true);
  const logs = useFetch(() => api.admin.audit({ page, pageSize: 30, ...(thisSeason && seasonId ? { seasonId } : {}) }), [page, thisSeason, seasonId]);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every important admin and bidding action is recorded." actions={
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={thisSeason} onChange={(e) => { setThisSeason(e.target.checked); setPage(1); }} /> Selected season only</label>
      } />
      <Async state={logs}>
        {({ items, total, pageSize }) => (
          <>
            <Table head={['When', 'Who', 'Action', 'Entity', 'Details']}>
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="td whitespace-nowrap text-mist">{dateTime(l.createdAt)}</td>
                  <td className="td">{l.user?.name ?? 'System'}</td>
                  <td className="td font-semibold">{l.action.replaceAll('_', ' ').toLowerCase()}</td>
                  <td className="td text-mist">{l.entity}</td>
                  <td className="td max-w-xs truncate font-mono text-xs text-mist" title={JSON.stringify(l.metadata)}>{l.metadata ? JSON.stringify(l.metadata) : ''}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-3 flex items-center justify-between text-sm text-mist">
              <span>{total} entries</span>
              <span className="flex gap-2"><Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="ghost" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button></span>
            </div>
          </>
        )}
      </Async>
    </>
  );
}
