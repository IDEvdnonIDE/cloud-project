import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.currentUser());

  const login = useCallback(async (email, password) => {
    const u = await api.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (details) => {
    const u = await api.register(details);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  /** Re-read the signed-in user (e.g. after saving a favourite). */
  const refresh = useCallback(() => setUser(api.currentUser()), []);

  const value = useMemo(() => ({ user, login, register, logout, refresh }), [user, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
