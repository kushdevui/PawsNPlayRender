// Axios adapter that answers requests from mock/data instead of the network.
// Used by src/api/client.ts unless EXPO_PUBLIC_USE_MOCKS=false.
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { handleMockRequest, type MockResponse } from './routes';

const LATENCY_MS = 300;
const BASE_PATH = '/api/v1';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Plain query-string parser (React Native's URLSearchParams is incomplete). */
const parseQuery = (qs: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const part of qs.split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      out[k] = v;
    }
  }
  return out;
};

const readToken = (config: InternalAxiosRequestConfig): string | null => {
  const h: any = config.headers;
  const raw = (typeof h?.get === 'function' ? h.get('Authorization') : undefined) ?? h?.Authorization ?? h?.authorization;
  return typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : null;
};

const toRequest = (config: InternalAxiosRequestConfig) => {
  const rawUrl = config.url ?? '';
  const qIndex = rawUrl.indexOf('?');
  const pathPart = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
  let path = pathPart.replace(/^https?:\/\/[^/]+/, '');
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  if (!path.startsWith('/')) path = `/${path}`;

  const query = qIndex >= 0 ? parseQuery(rawUrl.slice(qIndex + 1)) : {};
  for (const [k, v] of Object.entries((config.params ?? {}) as Record<string, unknown>)) {
    if (v !== undefined && v !== null) query[k] = String(v);
  }

  let body: unknown = config.data;
  if (typeof body === 'string' && body) {
    try {
      body = JSON.parse(body);
    } catch {
      /* leave as string */
    }
  }
  return { method: config.method ?? 'get', path, query, body, token: readToken(config) };
};

export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(LATENCY_MS);

  let result: MockResponse;
  let path = config.url ?? '';
  try {
    const req = toRequest(config);
    path = req.path;
    result = handleMockRequest(req);
  } catch (e) {
    // A bug in the mock itself - surface it instead of looking like a network error.
    console.error('[mock] adapter error', e);
    result = { status: 500, data: { error: { code: 'MOCK_ERROR', message: `Mock error: ${(e as Error).message}` } } };
  }

  const response: AxiosResponse = {
    data: result.data,
    status: result.status,
    statusText: String(result.status),
    headers: new AxiosHeaders(),
    config,
    request: {},
  };

  if (__DEV__) console.log(`[mock] ${config.method?.toUpperCase()} ${path} -> ${result.status}`);

  if (result.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    );
  }
  return response;
};
