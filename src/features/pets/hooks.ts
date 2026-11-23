import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/endpoints';
import type { Species } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const usePets = (params?: { species?: Species; ownerId?: string }) =>
  useQuery({ queryKey: queryKeys.pets(params), queryFn: () => petsApi.list({ limit: 100, ...params }) });
