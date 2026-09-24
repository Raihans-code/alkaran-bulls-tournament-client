import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY } from '../services/api.js';
import { resetSocket } from '../services/socket.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    resetSocket();
    setUser(null);
  }, []);

  const finish = useCallback(({ user: u, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    resetSocket();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.auth.me().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'ADMIN',
    isOwner: user?.role === 'OWNER' || user?.role === 'ADMIN',
    login: async (body) => finish(await api.auth.login(body)),
    register: async (body) => finish(await api.auth.register(body)),
    logout,
  }), [user, loading, finish, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
