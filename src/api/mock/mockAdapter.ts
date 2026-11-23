// Axios adapter that answers requests from mock/data instead of the network.
// Enabled in src/api/client.ts when EXPO_PUBLIC_USE_MOCKS=true.
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { handleMockRequest } from './routes';

const LATENCY_MS = 300;
const BASE_PATH = '/api/v1';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(LATENCY_MS);

  // Build path + query from url and params
  const rawUrl = config.url ?? '';
  const [pathPart, queryString = ''] = rawUrl.split('?');
  let path = pathPart.replace(/^https?:\/\/[^/]+/, '');
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  if (!path.startsWith('/')) path = `/${path}`;

  const query: Record<string, string> = {};
  new URLSearchParams(queryString).forEach((v, k) => (query[k] = v));
  Object.entries(config.params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query[k] = String(v);
  });

  let body: unknown = config.data;
  if (typeof body === 'string' && body) {
    try {
      body = JSON.parse(body);
    } catch {
      /* leave as string */
    }
  }

  const auth = AxiosHeaders.from(config.headers).get('Authorization');
  const token = typeof auth === 'string' ? auth.replace(/^Bearer\s+/i, '') : null;

  const result = handleMockRequest({ method: config.method ?? 'get', path, query, body, token });

  const response: AxiosResponse = {
    data: result.data,
    status: result.status,
    statusText: String(result.status),
    headers: {},
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
