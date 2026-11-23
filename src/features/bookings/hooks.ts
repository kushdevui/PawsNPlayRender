import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/endpoints';
import type { BookingFilters, BookingInput, BookingStatus } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useBookings = (filters?: BookingFilters) =>
  useQuery({ queryKey: queryKeys.bookings(filters), queryFn: () => bookingsApi.list({ limit: 500, ...filters }) });

export const useBooking = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.booking(id ?? ''), queryFn: () => bookingsApi.get(id!), enabled: !!id });

const useInvalidateBookings = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
};

export const useCreateBooking = () => {
  const invalidate = useInvalidateBookings();
  return useMutation({ mutationFn: (body: BookingInput) => bookingsApi.create(body), onSuccess: invalidate });
};

export const useUpdateBooking = (id: string) => {
  const invalidate = useInvalidateBookings();
  return useMutation({ mutationFn: (body: Partial<BookingInput>) => bookingsApi.update(id, body), onSuccess: invalidate });
};

export const useSetBookingStatus = () => {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<BookingStatus, 'pending'> }) => bookingsApi.setStatus(id, status),
    onSuccess: invalidate,
  });
};
