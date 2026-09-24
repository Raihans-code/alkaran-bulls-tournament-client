import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../services/api.js';
import { Button, Field } from '../components/ui.jsx';

export function AuthShell({ title, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <img src="/brand-mark.svg" alt="Alkaran Bulls" className="h-11 w-11 rounded-lg" />
          <span className="font-display text-2xl font-bold">Alkaran Bulls</span>
        </Link>
        <div className="card !p-6">
          <h1 className="mb-5 text-3xl font-bold">{title}</h1>
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-mist">{footer}</p>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await login(form);
      navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Log in" footer={<>Need a team owner account? Ask an admin to assign the owner role.</>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
    </AuthShell>
  );
}
