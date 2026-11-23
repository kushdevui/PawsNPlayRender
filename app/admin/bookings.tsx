import { AppText, Screen } from '@/components/ui';
import { BookingList } from '@/features/bookings/BookingList';

export default function AdminBookings() {
  return (
    <Screen>
      <AppText variant="title">All Bookings</AppText>
      <BookingList emptyText="No bookings yet." />
    </Screen>
  );
}
