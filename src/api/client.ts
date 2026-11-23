import axios, { AxiosError } from 'axios';
import { mockAdapter } from './mock/mockAdapter';
import type { ApiErrorBody } from './types';

/**
 * Mock JSON backend is the DEFAULT (no .env needed). Set EXPO_PUBLIC_USE_MOCKS=false
 * (and EXPO_PUBLIC_API_URL) only when the real Node API exists.
 */
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

if (__DEV__) console.log(`[api] ${USE_MOCKS ? 'MOCK mode (mock/data/*.json)' : `REAL API: ${API_URL}`}`);

// Token is kept in memory here; the auth store persists it with expo-secure-store
// and calls setAccessToken() on login / app start / logout.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const api = axios.create({
  baseURL: USE_MOCKS ? '/api/v1' : API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCKS ? { adapter: mockAdapter } : {}),
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

// Normalised error the UI can show directly.
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data?.error;
    // Only real connection problems get the "cannot reach server" message.
    const isNetwork = !err.response && (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT');
    if (__DEV__ && !err.response) console.warn('[api] request failed', err.code, err.message);
    // TODO(auth): on 401 try /auth/refresh once, else log out via auth store.
    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? (status ? 'HTTP_ERROR' : isNetwork ? 'NETWORK_ERROR' : 'CLIENT_ERROR'),
        body?.message ??
          (status ? err.message : isNetwork ? `Cannot reach server (${API_URL}). Check your connection.` : `Something went wrong: ${err.message}`),
      ),
    );
  },
);
