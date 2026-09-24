import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../services/api.js';
import { Button, Field } from '../components/ui.jsx';
import { AuthShell } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await register(form); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" footer={<>Already registered? <Link className="text-pitch underline" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input className="input" required minLength={2} value={form.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Phone (optional)"><input className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <Field label="Password" hint="At least 8 characters"><input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
