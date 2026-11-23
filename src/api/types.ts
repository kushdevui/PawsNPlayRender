// Shared API types. Keep in sync with mock/endpoints.json, docs/ARCHITECTURE.md and the Node backend.
// All dates are ISO-8601 strings in UTC (e.g. "2026-11-23T04:30:00.000Z"); the app shows them in local time.

export type Role = 'admin' | 'user' | 'staff';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
}

// ---------- Dogs ----------
export type Gender = 'male' | 'female';
export type Temperament = 'friendly' | 'shy' | 'reactive';
export type DogStatus = 'active' | 'archived';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  gender: Gender;
  dateOfBirth: string | null; // YYYY-MM-DD
  weightKg: number | null;
  color: string;
  /** Linked customer account - null until the customer app exists. */
  ownerId: string | null;
  ownerName: string;
  ownerPhone: string;
  vaccinated: boolean;
  vaccinationExpiry: string | null; // YYYY-MM-DD
  neutered: boolean;
  temperament: Temperament;
  feedingNotes: string;
  medicalNotes: string;
  notes: string;
  photoUrl: string | null;
  status: DogStatus;
  createdAt: string;
  updatedAt: string;
}

export type DogInput = Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'photoUrl' | 'status'> & {
  ownerId?: string | null;
  photoUrl?: string | null;
  status?: DogStatus;
};

// ---------- Bookings (boarding stays) ----------
/**
 * confirmed   - booked, dog not arrived yet
 * checked_in  - dog is at the facility (counts toward capacity)
 * checked_out - stay finished
 * cancelled   - not happening
 * (pending is reserved for future customer-app requests awaiting approval)
 */
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type BookingSource = 'admin' | 'app';

// ---------- Payments ----------
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank';
/** advance = paid before/at booking, payment = later instalment/settlement, refund = money returned (reduces paid). */
export type PaymentType = 'advance' | 'payment' | 'refund';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';

export interface Payment {
  id: string;
  amount: number; // always positive; refunds are subtracted
  type: PaymentType;
  method: PaymentMethod;
  note: string;
  receivedAt: string; // ISO
  recordedBy: string; // user id
}

export interface PaymentInput {
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  note?: string;
  receivedAt?: string; // default now
}

export interface DogSummary {
  id: string;
  name: string;
  breed: string;
  ownerName: string;
  ownerPhone: string;
}

export interface Booking {
  id: string;
  dogId: string;
  /** Denormalised for lists (server joins it; Mongo: populate). */
  dog: DogSummary | null;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  kennel: string | null;
  nights: number;
  pricePerNight: number;
  totalAmount: number;
  currency: string;
  notes: string;
  source: BookingSource;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
  /** Derived by the server: advances + payments - refunds. */
  amountPaid: number;
  /** Derived: totalAmount - amountPaid (0 for cancelled; negative = overpaid). */
  balanceDue: number;
  /** Derived from amountPaid vs totalAmount. */
  paymentStatus: PaymentStatus;
}

export interface BookingInput {
  dogId: string;
  checkIn: string;
  checkOut: string;
  kennel?: string | null;
  pricePerNight?: number;
  notes?: string;
}

export interface BookingFilters {
  /** Bookings overlapping [from, to) - use for month or single-day views. */
  from?: string;
  to?: string;
  status?: BookingStatus;
  dogId?: string;
  paymentStatus?: PaymentStatus | 'due'; // due = unpaid or partial
}

/** Billing for stays that CHECK IN within [from, to). Cancelled stays are excluded. */
export interface BillingSummary {
  from: string;
  to: string;
  currency: string;
  bookings: number;
  expected: number; // sum of totalAmount
  received: number; // sum of amountPaid
  due: number; // sum of positive balances
  advances: number; // sum of advance payments
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  /** All months, non-cancelled, not yet fully paid. */
  outstandingAllTime: number;
  outstandingBookings: number;
}

// ---------- Facility ----------
export interface FacilitySettings {
  facilityName: string;
  capacity: number;
  defaultCheckInTime: string; // HH:mm
  defaultCheckOutTime: string; // HH:mm
  pricePerNight: number;
  currency: string;
  timezone: string;
}

export interface DashboardStats {
  capacity: number;
  occupiedNow: number;
  availableNow: number;
  todayCheckIns: Booking[];
  todayCheckOuts: Booking[];
  upcoming: Booking[]; // next 7 days, not yet checked in
  occupancyNext7Days: Array<{ date: string; count: number }>; // date = YYYY-MM-DD (local), count = peak dogs that day
  activeDogs: number;
  bookingsThisMonth: number;
  /** Money still to collect across all non-cancelled stays. */
  paymentsDue: number;
  paymentsDueBookings: number;
}

/** One calendar day in the occupancy calendar. */
export interface OccupancyDay {
  date: string; // YYYY-MM-DD (facility local)
  /** Peak dogs present at the same time that day. */
  occupied: number;
  available: number;
  checkIns: number;
  checkOuts: number;
}

export interface OccupancyCalendar {
  capacity: number;
  days: OccupancyDay[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ---------- Envelopes ----------
export interface ApiItem<T> {
  data: T;
}
export interface ApiList<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface ListParams {
  page?: number;
  limit?: number;
}
