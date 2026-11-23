import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common';
import { BookingForm } from '@/features/bookings/BookingForm';
import { useCreateBooking } from '@/features/bookings/hooks';

export default function NewBooking() {
  const { dogId, date } = useLocalSearchParams<{ dogId?: string; date?: string }>();
  const create = useCreateBooking();

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <BookingForm
        defaultDogId={dogId}
        defaultDate={date}
        submitLabel="Create booking"
        submitting={create.isPending}
        onSubmit={async (input) => {
          const booking = await create.mutateAsync(input);
          router.replace({ pathname: '/admin/booking/[id]', params: { id: booking.id } });
        }}
      />
    </Screen>
  );
}
