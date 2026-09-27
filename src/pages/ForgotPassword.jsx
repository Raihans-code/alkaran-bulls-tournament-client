import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './Login.jsx';
import { api, errorMessage } from '../services/api.js';
import { Button, Field } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: '', reason: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.auth.forgotPassword(form);
      setMessage(result.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Forgot password" footer={<Link to="/login" className="text-pitch hover:underline">Back to login</Link>}>
      <p className="mb-5 text-sm text-mist">Submit a recovery request. An administrator will review it and provide a temporary password if approved.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Reason" hint="Optional — tell the administrator why you need access restored.">
          <textarea className="input min-h-24" maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
        {message && <p role="status" className="text-sm text-pitch">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Submit request</Button>
      </form>
    </AuthShell>
  );
}
