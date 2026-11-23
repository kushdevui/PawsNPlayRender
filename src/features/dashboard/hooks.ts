import { useQuery } from '@tanstack/react-query';
import { adminApi, settingsApi } from '@/api/endpoints';
import { queryKeys } from '../queryKeys';

export const useDashboard = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: adminApi.dashboard, refetchInterval: 60_000 });

export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.get });
