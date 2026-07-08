'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, setToken, clearToken, getToken } from './api';
import { Role, User } from './types';

type RegisterRole = Extract<Role, 'TRABAJADOR' | 'EMPLEADOR'>;

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  // Obligatorio solo para EMPLEADOR (validado por la API).
  telefono?: string;
  role: RegisterRole;
}

// Respuesta de /auth/google: sesión iniciada, o falta completar el perfil
// (cuenta nueva: la API necesita rol y, si es empleador, teléfono).
export type GoogleResult =
  | { needsProfile: true; email: string; nombre: string }
  | { needsProfile: false; user: User };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  loginWithGoogle: (
    idToken: string,
    extra?: { role: RegisterRole; telefono?: string },
  ) => Promise<GoogleResult>;
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

  async function loginWithGoogle(
    idToken: string,
    extra?: { role: RegisterRole; telefono?: string },
  ): Promise<GoogleResult> {
    const res = await api<
      | { needsProfile: true; email: string; nombre: string }
      | { accessToken: string; user: User }
    >('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, ...extra }),
    });
    if ('needsProfile' in res && res.needsProfile) {
      return { needsProfile: true, email: res.email, nombre: res.nombre };
    }
    const session = res as { accessToken: string; user: User };
    setToken(session.accessToken);
    setUser(session.user);
    return { needsProfile: false, user: session.user };
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
