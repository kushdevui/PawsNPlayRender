import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { waiversApi } from '@/api/endpoints';
import type { WaiverFilters, WaiverSubmission, WaiverUpdate } from '@/api/types';
import { addDays, startOfDay } from '@/utils/date';
import { queryKeys } from '../queryKeys';
import { waiverText } from './waiverText';

/** Current waiver text + consent list (public). Kept fresh: a stale version is rejected with 409 on submit. */
export const useCurrentWaiver = () =>
  useQuery({ queryKey: queryKeys.currentWaiver, queryFn: waiversApi.current, staleTime: 5 * 60 * 1000 });

/** POST /waivers (public, JSON, one call). */
export const useSubmitWaiver = () => useMutation({ mutationFn: (body: WaiverSubmission) => waiversApi.submit(body) });

/** Signed waivers, newest first (admin, staff). */
export const useWaivers = (filters?: WaiverFilters, options?: { enabled?: boolean; limit?: number }) =>
  useQuery({
    queryKey: queryKeys.waivers({ ...filters, limit: options?.limit }),
    queryFn: () => waiversApi.list({ limit: options?.limit ?? 500, ...filters }),
    enabled: options?.enabled ?? true,
  });

/** Waivers signed in the last 7 days, today included (dashboard card). `from` is a day start, so the key is stable all day. */
export const useRecentWaiversCount = (enabled = true) => {
  const from = startOfDay(addDays(new Date(), -6)).toISOString();
  const q = useWaivers({ from }, { limit: 1, enabled });
  return { count: q.data?.meta.total, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
};

export const useWaiver = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.waiver(id ?? ''), queryFn: () => waiversApi.get(id!), enabled: !!id });

/** PATCH linked dog / form (admin). The response is the full waiver, so the detail updates without another GET. */
export const useUpdateWaiver = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WaiverUpdate) => waiversApi.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.waiver(id), data);
      qc.invalidateQueries({ queryKey: ['waivers', 'list'] });
    },
  });
};

/** True when the server says the page was signed against an older text (show "Reload"). */
export const isWaiverOutdated = (e: unknown) => e instanceof ApiError && (e.code === 'WAIVER_OUTDATED' || e.status === 409);

/** Friendly message for a failed submit: the server's `error.message`, or plain words for network trouble. */
export function waiverErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'NETWORK_ERROR') return waiverText.networkError;
    if (e.status === 429 && (e.code === 'HTTP_ERROR' || !e.message)) return waiverText.tooMany;
    if (e.status === 409 && e.code === 'HTTP_ERROR') return waiverText.outdated;
    if (e.code === 'HTTP_ERROR' || e.code === 'CLIENT_ERROR') return waiverText.genericError;
    return e.message || waiverText.genericError;
  }
  return waiverText.genericError;
}
