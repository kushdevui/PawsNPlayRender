import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, bookingsApi } from '@/api/endpoints';
import type { PaymentInput } from '@/api/types';
import { queryKeys } from '../queryKeys';

export const useBilling = (from: string, to: string) =>
  useQuery({ queryKey: queryKeys.billing(from, to), queryFn: () => adminApi.billing(from, to) });

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['admin'] }); // dashboard due + billing
  };
};

export const useAddPayment = (bookingId: string) => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (body: PaymentInput) => bookingsApi.addPayment(bookingId, body), onSuccess: invalidate });
};

export const useRemovePayment = (bookingId: string) => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (paymentId: string) => bookingsApi.removePayment(bookingId, paymentId), onSuccess: invalidate });
};
