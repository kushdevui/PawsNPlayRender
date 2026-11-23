import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/endpoints';
import type { BookingStatus } from '@/api/types';
import { usePets } from '../pets/hooks';
import { useServices } from '../services/hooks';
import { queryKeys } from '../queryKeys';

export const useBookings = (params?: { status?: BookingStatus }) =>
  useQuery({ queryKey: queryKeys.bookings(params), queryFn: () => bookingsApi.list({ limit: 100, ...params }) });

export const useUpdateBookingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<BookingStatus, 'pending'> }) =>
      bookingsApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

/** Maps ids -> names so booking rows can show "Bruno · Day Care". */
export const useBookingLabels = () => {
  const pets = usePets();
  const services = useServices();
  return useMemo(() => {
    const petName = new Map(pets.data?.data.map((p) => [p.id, p.name]));
    const serviceName = new Map(services.data?.data.map((s) => [s.id, s.name]));
    return {
      pet: (id: string) => petName.get(id) ?? 'Pet',
      service: (id: string) => serviceName.get(id) ?? 'Service',
    };
  }, [pets.data, services.data]);
};
