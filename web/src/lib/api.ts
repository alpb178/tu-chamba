const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = 'tuchamba_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const NETWORK_ERROR = {
  es: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  en: "Couldn't reach the server. Check your connection and try again.",
};

function pageLanguage(): keyof typeof NETWORK_ERROR {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en'
    ? 'en'
    : 'es';
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    // fetch throws TypeError ("Failed to fetch") on network/CORS failures.
    // We translate it into a message the user can understand, in the page's
    // language (<html lang> follows the URL locale; the admin panel is "es").
    throw new ApiError(0, NETWORK_ERROR[pageLanguage()]);
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
