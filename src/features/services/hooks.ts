import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/api/endpoints';
import type { ServiceCategory } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useServices = (params?: { category?: ServiceCategory }) =>
  useQuery({ queryKey: queryKeys.services(params), queryFn: () => servicesApi.list({ limit: 100, ...params }) });
