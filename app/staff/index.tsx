import { AppText, Screen } from '@/components/common';
import { BookingList } from '@/features/bookings/BookingList';

export default function StaffSchedule() {
  return (
    <Screen>
      <AppText variant="title">My Schedule</AppText>
      <AppText variant="caption">Bookings assigned to you</AppText>
      <BookingList emptyText="Nothing assigned to you yet." />
    </Screen>
  );
}
