import { AppText, Screen } from '@/components/ui';
import { BookingList } from '@/features/bookings/BookingList';

export default function UserBookings() {
  return (
    <Screen>
      <AppText variant="title">My Bookings</AppText>
      <BookingList emptyText="No bookings yet." />
    </Screen>
  );
}
