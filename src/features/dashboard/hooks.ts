import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, settingsApi } from '@/api/endpoints';
import type { FacilitySettings } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useDashboard = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: adminApi.dashboard, refetchInterval: 60_000 });

/** Per-day occupancy for local dates [from, to) - 'YYYY-MM-DD'. */
export const useOccupancy = (from: string, to: string) =>
  useQuery({ queryKey: queryKeys.occupancy(from, to), queryFn: () => adminApi.occupancy(from, to) });

export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.get });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<FacilitySettings>) => settingsApi.update(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings });
      qc.invalidateQueries({ queryKey: ['admin'] }); // dashboard + occupancy use capacity
    },
  });
};
