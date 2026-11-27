import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { mockAdapter } from './mock/mockAdapter';
import type { ApiErrorBody } from './types';

/**
 * The REAL Node API is the default. Set EXPO_PUBLIC_USE_MOCKS=true to use the mock JSON backend
 * (mock/data/*.json) instead, e.g. when the API isn't running.
 */
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * API base URL. In development, "localhost" in EXPO_PUBLIC_API_URL is swapped for the computer's
 * LAN address that Expo is serving from (Constants.expoConfig.hostUri, e.g. "192.168.1.5:8081"),
 * so a phone on the same Wi-Fi reaches the API running on that computer. The backend must listen
 * on 0.0.0.0, not only 127.0.0.1. Set a full URL (e.g. https://api.pawsnplay.com/api/v1) to skip this.
 */
const resolveApiUrl = () => {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  if (!__DEV__ || !/\/\/(localhost|127\.0\.0\.1)\b/.test(raw)) return raw;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return devHost && IPV4.test(devHost) ? raw.replace(/localhost|127\.0\.0\.1/, devHost) : raw;
};

export const API_URL = resolveApiUrl();

if (__DEV__) console.log(`[api] ${USE_MOCKS ? 'MOCK mode (mock/data/*.json)' : `REAL API: ${API_URL}`}`);

// Token is kept in memory here; the auth store persists it with expo-secure-store
// and calls setAccessToken() on login / app start / logout.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
/** Current access token (for links the browser opens itself, e.g. the printable waiver). */
export const getAccessToken = () => accessToken;

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
