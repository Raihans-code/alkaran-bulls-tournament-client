import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, errorMessage } from '../services/api.js';
import { Button, Field, PageHeader, Card } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const forced = !!user?.mustChangePassword;
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api.auth.changePassword(form);
      toast.success('Password changed successfully');
      const from = location.state?.from;
      navigate(from && from !== '/change-password' ? from : user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
      window.location.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={forced ? 'Set your new password' : 'Change password'} subtitle={forced ? 'Your account was recovered by an administrator. Choose a new private password to continue.' : 'Update your account password.'} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Current password"><input className="input" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></Field>
          <Field label="New password" hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" minLength={8} required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password"><input className="input" type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <Button type="submit" loading={busy}>Change password</Button>
        </form>
      </Card>
    </div>
  );
}
