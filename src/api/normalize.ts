// Make API responses safe to render even when the server's shape differs from the contract
// (docs/BACKEND_API_SPEC.md). Missing fields get safe defaults instead of crashing screens,
// and in development we warn once per field so the backend can be aligned.
import type { AuthResponse, BillingSummary, Booking, DashboardStats, Dog, FacilitySettings, OccupancyCalendar, PaymentStatus, User } from './types';

const warned = new Set<string>();
const warnMissing = (where: string, obj: unknown, fields: string[]) => {
  if (!__DEV__ || !obj || typeof obj !== 'object') return;
  for (const f of fields) {
    const key = `${where}.${f}`;
    if ((obj as Record<string, unknown>)[f] === undefined && !warned.has(key)) {
      warned.add(key);
      console.warn(`[api] ${where} is missing "${f}" - using a default. See docs/BACKEND_API_SPEC.md.`);
    }
  }
};

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : v == null ? fallback : String(v));
/** Accepts `id` or Mongo-style `_id`. */
const idOf = (o: any) => str(o?.id ?? o?._id);

export function normalizeBooking(raw: any): Booking {
  warnMissing('Booking', raw, ['id', 'dogId', 'checkIn', 'checkOut', 'status', 'nights', 'totalAmount', 'payments', 'amountPaid', 'balanceDue', 'paymentStatus', 'dog']);
  const payments = arr<any>(raw?.payments).map((p) => ({
    id: idOf(p),
    amount: num(p?.amount),
    type: p?.type ?? 'payment',
    method: p?.method ?? 'cash',
    note: str(p?.note),
    receivedAt: str(p?.receivedAt ?? p?.createdAt),
    recordedBy: str(p?.recordedBy),
  }));
  const status = raw?.status ?? 'confirmed';
  const totalAmount = num(raw?.totalAmount);
  const amountPaid = raw?.amountPaid !== undefined ? num(raw.amountPaid) : payments.reduce((s, p) => s + (p.type === 'refund' ? -p.amount : p.amount), 0);
  const owed = status === 'cancelled' ? 0 : totalAmount;
  const balanceDue = raw?.balanceDue !== undefined ? num(raw.balanceDue) : owed - amountPaid;
  const paymentStatus: PaymentStatus =
    raw?.paymentStatus ?? (balanceDue < 0 ? 'overpaid' : owed === 0 || balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid');
  // dogId may come populated as an object.
  const dogObj = raw?.dog ?? (raw?.dogId && typeof raw.dogId === 'object' ? raw.dogId : null);
  const dogId = typeof raw?.dogId === 'object' && raw?.dogId ? idOf(raw.dogId) : str(raw?.dogId ?? dogObj?.id ?? dogObj?._id);
  return {
    id: idOf(raw),
    dogId,
    dog: dogObj
      ? { id: idOf(dogObj) || dogId, name: str(dogObj.name, 'Dog'), breed: str(dogObj.breed), ownerName: str(dogObj.ownerName), ownerPhone: str(dogObj.ownerPhone) }
      : null,
    checkIn: str(raw?.checkIn),
    checkOut: str(raw?.checkOut),
    status,
    kennel: raw?.kennel ?? null,
    nights: num(raw?.nights, 1),
    pricePerNight: num(raw?.pricePerNight),
    totalAmount,
    currency: str(raw?.currency, 'INR'),
    notes: str(raw?.notes),
    source: raw?.source ?? 'admin',
    createdBy: str(raw?.createdBy),
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
    payments,
    amountPaid,
    balanceDue,
    paymentStatus,
  };
}

export function normalizeDog(raw: any): Dog {
  warnMissing('Dog', raw, ['id', 'name', 'ownerName', 'ownerPhone', 'status']);
  return {
    id: idOf(raw),
    name: str(raw?.name, 'Dog'),
    breed: str(raw?.breed),
    gender: raw?.gender === 'female' ? 'female' : 'male',
    dateOfBirth: raw?.dateOfBirth ?? null,
    weightKg: raw?.weightKg ?? null,
    color: str(raw?.color),
    ownerId: raw?.ownerId ?? null,
    ownerName: str(raw?.ownerName),
    ownerPhone: str(raw?.ownerPhone),
    vaccinated: !!raw?.vaccinated,
    vaccinationExpiry: raw?.vaccinationExpiry ?? null,
    neutered: !!raw?.neutered,
    temperament: raw?.temperament ?? 'friendly',
    feedingNotes: str(raw?.feedingNotes),
    medicalNotes: str(raw?.medicalNotes),
    notes: str(raw?.notes),
    photoUrl: raw?.photoUrl ?? null,
    documents: arr<any>(raw?.documents).map((d) => ({ ...d, id: idOf(d) })),
    status: raw?.status === 'archived' ? 'archived' : 'active',
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
  };
}

export function normalizeDashboard(raw: any): DashboardStats {
  warnMissing('DashboardStats', raw, [
    'capacity', 'occupiedNow', 'availableNow', 'todayCheckIns', 'todayCheckOuts', 'upcoming',
    'occupancyNext7Days', 'activeDogs', 'bookingsThisMonth', 'paymentsDue', 'paymentsDueBookings',
  ]);
  const capacity = num(raw?.capacity);
  const occupiedNow = num(raw?.occupiedNow);
  return {
    capacity,
    occupiedNow,
    availableNow: raw?.availableNow !== undefined ? num(raw.availableNow) : Math.max(0, capacity - occupiedNow),
    todayCheckIns: arr(raw?.todayCheckIns).map(normalizeBooking),
    todayCheckOuts: arr(raw?.todayCheckOuts).map(normalizeBooking),
    upcoming: arr(raw?.upcoming).map(normalizeBooking),
    occupancyNext7Days: arr<any>(raw?.occupancyNext7Days).map((d) => ({ date: str(d?.date), count: num(d?.count) })),
    activeDogs: num(raw?.activeDogs),
    bookingsThisMonth: num(raw?.bookingsThisMonth),
    paymentsDue: num(raw?.paymentsDue),
    paymentsDueBookings: num(raw?.paymentsDueBookings),
  };
}

export function normalizeOccupancy(raw: any): OccupancyCalendar {
  warnMissing('OccupancyCalendar', raw, ['capacity', 'days']);
  const capacity = num(raw?.capacity);
  return {
    capacity,
    days: arr<any>(raw?.days).map((d) => {
      const occupied = num(d?.occupied);
      return {
        date: str(d?.date),
        occupied,
        available: d?.available !== undefined ? num(d.available) : Math.max(0, capacity - occupied),
        checkIns: num(d?.checkIns),
        checkOuts: num(d?.checkOuts),
      };
    }),
  };
}

export function normalizeBilling(raw: any): BillingSummary {
  warnMissing('BillingSummary', raw, ['expected', 'received', 'due', 'outstandingAllTime', 'collected']);
  return {
    from: str(raw?.from),
    to: str(raw?.to),
    currency: str(raw?.currency, 'INR'),
    bookings: num(raw?.bookings),
    expected: num(raw?.expected),
    received: num(raw?.received),
    due: num(raw?.due),
    advances: num(raw?.advances),
    paidCount: num(raw?.paidCount),
    partialCount: num(raw?.partialCount),
    unpaidCount: num(raw?.unpaidCount),
    outstandingAllTime: num(raw?.outstandingAllTime),
    outstandingBookings: num(raw?.outstandingBookings),
    collected: num(raw?.collected),
    collectedCount: num(raw?.collectedCount),
  };
}

export function normalizeSettings(raw: any): FacilitySettings {
  warnMissing('FacilitySettings', raw, ['capacity', 'pricePerNight', 'defaultCheckInTime', 'defaultCheckOutTime']);
  return {
    facilityName: str(raw?.facilityName, "Paws N' Play Boarding"),
    capacity: num(raw?.capacity, 1),
    defaultCheckInTime: str(raw?.defaultCheckInTime, '10:00'),
    defaultCheckOutTime: str(raw?.defaultCheckOutTime, '18:00'),
    pricePerNight: num(raw?.pricePerNight),
    currency: str(raw?.currency, 'INR'),
    timezone: str(raw?.timezone, 'Asia/Kolkata'),
  };
}

export function normalizeUser(raw: any): User {
  warnMissing('User', raw, ['id', 'name', 'email', 'role']);
  return {
    id: idOf(raw),
    name: str(raw?.name, str(raw?.email, 'User')),
    email: str(raw?.email),
    role: raw?.role === 'admin' || raw?.role === 'staff' ? raw.role : 'user',
    phone: raw?.phone ?? null,
    avatarUrl: raw?.avatarUrl ?? null,
    status: raw?.status === 'inactive' ? 'inactive' : 'active',
    createdAt: str(raw?.createdAt),
  };
}

/** Accepts accessToken/token and refreshToken naming variants. */
export function normalizeAuth(raw: any): AuthResponse {
  warnMissing('AuthResponse', raw, ['accessToken', 'refreshToken', 'user']);
  return {
    accessToken: str(raw?.accessToken ?? raw?.token ?? raw?.access_token),
    refreshToken: str(raw?.refreshToken ?? raw?.refresh_token),
    user: normalizeUser(raw?.user ?? {}),
  };
}
