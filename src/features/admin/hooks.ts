import { useQuery } from '@tanstack/react-query';
import { adminApi, usersApi } from '@/api/endpoints';
import type { Role, UserStatus } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useDashboard = () => useQuery({ queryKey: queryKeys.dashboard, queryFn: adminApi.dashboard });

export const useUsers = (params?: { role?: Role; status?: UserStatus; search?: string }) =>
  useQuery({ queryKey: queryKeys.users(params), queryFn: () => usersApi.list({ limit: 100, ...params }) });
