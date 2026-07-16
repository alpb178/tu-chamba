'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, setToken, clearToken, getToken } from './api';
import { User } from './types';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  async function register(data: RegisterData) {
    const res = await api<{ accessToken: string; user: User }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) },
    );
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  // Con Google la cuenta se crea directamente si no existe (correo ya
  // verificado); el teléfono se completa después desde el perfil.
  async function loginWithGoogle(idToken: string) {
    const res = await api<{ accessToken: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  // Recarga el usuario desde el backend (p. ej. tras verificar el correo).
  async function refresh() {
    try {
      setUser(await api<User>('/auth/me'));
    } catch {
      /* sin sesión válida: no hacemos nada */
    }
  }

  function logout() {
    // Best-effort: deja la traza de cierre de sesión antes de descartar el
    // token (el JWT es stateless, la sesión muere al borrarlo igualmente).
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
