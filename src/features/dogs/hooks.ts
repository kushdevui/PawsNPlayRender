import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dogsApi } from '@/api/endpoints';
import type { DogInput, DogStatus } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useDogs = (params?: { search?: string; status?: DogStatus | 'all' }) =>
  useQuery({
    queryKey: queryKeys.dogs(params),
    queryFn: () => dogsApi.list({ limit: 500, ...(params as { search?: string; status?: DogStatus }) }),
  });

export const useDog = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.dog(id ?? ''), queryFn: () => dogsApi.get(id!), enabled: !!id });

const useInvalidateDogs = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['dogs'] });
    qc.invalidateQueries({ queryKey: ['bookings'] }); // bookings embed dog name/owner
    qc.invalidateQueries({ queryKey: ['admin'] }); // dashboard + occupancy calendar
  };
};

export const useCreateDog = () => {
  const invalidate = useInvalidateDogs();
  return useMutation({ mutationFn: (body: DogInput) => dogsApi.create(body), onSuccess: invalidate });
};

export const useUpdateDog = (id: string) => {
  const invalidate = useInvalidateDogs();
  return useMutation({ mutationFn: (body: Partial<DogInput>) => dogsApi.update(id, body), onSuccess: invalidate });
};

/** Dog choices for pickers/filters. `includeArchived` for history lookups. */
export const useDogOptions = (includeArchived = false) => {
  const { data, isLoading } = useDogs({ status: includeArchived ? 'all' : 'active' });
  const options = useMemo(
    () =>
      (data?.data ?? []).map((d) => ({
        value: d.id,
        label: d.status === 'archived' ? `${d.name} (archived)` : d.name,
        description: `${d.breed} · ${d.ownerName} · ${d.ownerPhone}`,
      })),
    [data],
  );
  return { options, isLoading };
};
