import type { BookingStatus } from '@/api/types';
import type { BadgeTone } from '@/components/common';

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Upcoming',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
};

export const bookingStatusTone: Record<BookingStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'brand',
  checked_in: 'success',
  checked_out: 'neutral',
  cancelled: 'danger',
};

/** Status filter options for the bookings list. */
export const BOOKING_STATUS_FILTERS: Array<{ label: string; value?: BookingStatus }> = [
  { label: 'All' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Checked in', value: 'checked_in' },
  { label: 'Checked out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
];
