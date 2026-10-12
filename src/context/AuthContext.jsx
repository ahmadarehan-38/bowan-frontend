import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);
const SESSION_KEY = 'bowan.session';

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session?.isDemo) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const saveSession = useCallback((next) => {
    setSession(next);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    api.get('/auth/me').then(({ data }) => {
      if (active && data.user) saveSession({ user: data.user });
    }).catch((error) => {
      if (active && error?.response?.status === 401) saveSession(null);
      // If the API is temporarily unreachable, keep the cached shell available while requests retry.
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.user?.academySlug) localStorage.setItem('bowan.tenantSlug', data.user.academySlug);
    else localStorage.removeItem('bowan.tenantSlug');
    const next = { user: data.user };
    saveSession(next);
    return data.user;
  }, [saveSession]);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    if (data.user?.academySlug) localStorage.setItem('bowan.tenantSlug', data.user.academySlug);
    else localStorage.removeItem('bowan.tenantSlug');
    const next = { user: data.user };
    saveSession(next);
    return data.user;
  }, [saveSession]);

  const logout = useCallback(async () => {
    if (session) {
      try { await api.post('/auth/logout'); } catch { /* clear local UI even if the API is offline */ }
    }
    localStorage.removeItem('bowan.tenantSlug');
    saveSession(null);
  }, [saveSession, session]);

  const value = useMemo(() => ({ user: session?.user || null, login, register, logout }), [session, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
