import axios, { AxiosError } from 'axios';
import { mockAdapter } from './mock/mockAdapter';
import type { ApiErrorBody } from './types';

export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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
    // TODO(auth): on 401 try /auth/refresh once, else log out via auth store.
    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR'),
        body?.message ?? (status ? err.message : 'Cannot reach server. Check your connection.'),
      ),
    );
  },
);
