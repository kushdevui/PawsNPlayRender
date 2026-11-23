// Mock route handlers for the boarding admin. Mirrors mock/endpoints.json and docs/ARCHITECTURE.md.
// No axios here, so it is easy to unit test. The Node backend should implement the same rules.
import { db, newId, publicUser, type MockUser, type StoredBooking } from './db';
import type { Booking, BookingStatus, Dog, PaymentStatus, Role } from '../types';

export interface MockRequest {
  method: string;
  path: string; // e.g. /dogs/d_001 (no base URL, no query string)
  query: Record<string, string>;
  body: any;
  token: string | null;
}
export interface MockResponse {
  status: number;
  data: unknown;
}
interface Ctx extends MockRequest {
  params: Record<string, string>;
  user: MockUser | null;
}
type Handler = (ctx: Ctx) => MockResponse;

// ---------- helpers ----------
class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
const ok = (data: unknown, status = 200): MockResponse => ({ status, data: { data } });
const fail = (status: number, code: string, message: string, details?: unknown): never => {
  throw new HttpError(status, code, message, details);
};

const requireUser = (ctx: Ctx, roles?: Role[]): MockUser => {
  if (!ctx.user) return fail(401, 'UNAUTHORIZED', 'Please log in again.');
  if (roles && !roles.includes(ctx.user.role)) return fail(403, 'FORBIDDEN', 'You do not have access to this.');
  return ctx.user;
};

const list = <T>(items: T[], query: Record<string, string>): MockResponse => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(query.limit) || 50));
  const start = (page - 1) * limit;
  return { status: 200, data: { data: items.slice(start, start + limit), meta: { total: items.length, page, limit } } };
};

const findOr404 = <T extends { id: string }>(items: T[], id: string, label: string): T =>
  items.find((i) => i.id === id) ?? fail(404, 'NOT_FOUND', `${label} not found`);

const tokens = (user: MockUser) => ({
  accessToken: `mock-access-${user.id}`,
  refreshToken: `mock-refresh-${user.id}`,
  user: publicUser(user),
});

const userFromToken = (token: string | null, kind: 'access' | 'refresh' = 'access') => {
  const prefix = `mock-${kind}-`;
  if (!token?.startsWith(prefix)) return null;
  const user = db.users.find((u) => u.id === token.slice(prefix.length));
  return user && user.status === 'active' ? user : null;
};

const nowIso = () => new Date().toISOString();
const ms = (iso: string) => new Date(iso).getTime();
const DAY = 24 * 60 * 60 * 1000;

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Nights = number of calendar days between check-in date and check-out date (min 1). */
export const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.max(1, Math.round((startOfLocalDay(new Date(checkOut)).getTime() - startOfLocalDay(new Date(checkIn)).getTime()) / DAY));

/** Bookings that occupy a kennel. */
const OCCUPYING: BookingStatus[] = ['confirmed', 'checked_in'];
const OPEN: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/** Highest number of dogs present at the same time within [start, end), ignoring one booking. */
const peakOccupancy = (start: number, end: number, ignoreId?: string, statuses: BookingStatus[] = OCCUPYING) => {
  const relevant = db.bookings.filter(
    (b) => b.id !== ignoreId && statuses.includes(b.status) && overlaps(start, end, ms(b.checkIn), ms(b.checkOut)),
  );
  const points = [start, ...relevant.map((b) => ms(b.checkIn)).filter((p) => p > start && p < end)];
  return Math.max(0, ...points.map((p) => relevant.filter((b) => ms(b.checkIn) <= p && p < ms(b.checkOut)).length));
};

/**
 * Stats for one local calendar day.
 * occupied = peak dogs present at the same time that day (a dog leaving at 11:00 and one arriving
 * at 20:00 share a kennel). Past days also count checked-out stays so history stays accurate.
 */
const dayStats = (dayStart: number) => {
  const dayEnd = dayStart + DAY;
  const isPast = dayEnd <= startOfLocalDay(new Date()).getTime();
  const statuses: BookingStatus[] = isPast ? [...OCCUPYING, 'checked_out'] : OCCUPYING;
  const occupied = peakOccupancy(dayStart, dayEnd, undefined, statuses);
  const counted = db.bookings.filter((b) => statuses.includes(b.status));
  return {
    date: localDateKey(new Date(dayStart)),
    occupied,
    available: Math.max(0, db.settings.capacity - occupied),
    checkIns: counted.filter((b) => ms(b.checkIn) >= dayStart && ms(b.checkIn) < dayEnd).length,
    checkOuts: counted.filter((b) => ms(b.checkOut) >= dayStart && ms(b.checkOut) < dayEnd).length,
  };
};

const parseDateKey = (key: string | undefined) => {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

const dogSummary = (dogId: string) => {
  const d = db.dogs.find((x) => x.id === dogId);
  return d ? { id: d.id, name: d.name, breed: d.breed, ownerName: d.ownerName, ownerPhone: d.ownerPhone } : null;
};
/** Money rules: paid = advances + payments - refunds; cancelled stays owe nothing. */
const paymentTotals = (b: StoredBooking) => {
  const amountPaid = b.payments.reduce((sum, p) => sum + (p.type === 'refund' ? -p.amount : p.amount), 0);
  const owed = b.status === 'cancelled' ? 0 : b.totalAmount;
  const balanceDue = owed - amountPaid;
  const paymentStatus: PaymentStatus =
    balanceDue < 0 ? 'overpaid' : owed === 0 || balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
  return { amountPaid, balanceDue, paymentStatus };
};
const withDog = (b: StoredBooking): Booking => ({ ...b, dog: dogSummary(b.dogId), ...paymentTotals(b) });

/** Shared create/update validation for a stay. */
const validateStay = (input: { dogId: string; checkIn: string; checkOut: string }, ignoreId?: string) => {
  const dog = db.dogs.find((d) => d.id === input.dogId);
  if (!dog) fail(422, 'VALIDATION_ERROR', 'Choose a dog.');
  if (dog!.status !== 'active') fail(422, 'VALIDATION_ERROR', `${dog!.name} is archived.`);
  const start = ms(input.checkIn);
  const end = ms(input.checkOut);
  if (Number.isNaN(start) || Number.isNaN(end)) fail(422, 'VALIDATION_ERROR', 'Enter check-in and check-out date and time.');
  if (end <= start) fail(422, 'VALIDATION_ERROR', 'Check-out must be after check-in.');

  const clash = db.bookings.find(
    (b) => b.id !== ignoreId && b.dogId === input.dogId && OPEN.includes(b.status) && overlaps(start, end, ms(b.checkIn), ms(b.checkOut)),
  );
  if (clash) fail(422, 'DOG_ALREADY_BOOKED', `${dog!.name} already has a booking in these dates.`, { bookingId: clash.id });

  const peak = peakOccupancy(start, end, ignoreId);
  if (peak >= db.settings.capacity) {
    fail(422, 'CAPACITY_FULL', `Boarding is full (${db.settings.capacity} dogs) for part of these dates.`, { peak, capacity: db.settings.capacity });
  }
};

const byCheckIn = (a: StoredBooking, b: StoredBooking) => a.checkIn.localeCompare(b.checkIn);

const DOG_FIELDS: Array<keyof Dog> = [
  'name', 'breed', 'gender', 'dateOfBirth', 'weightKg', 'color', 'ownerId', 'ownerName', 'ownerPhone', 'vaccinated',
  'vaccinationExpiry', 'neutered', 'temperament', 'feedingNotes', 'medicalNotes', 'notes', 'photoUrl', 'status',
];
const pick = <T extends object>(src: any, keys: Array<keyof T>): Partial<T> =>
  Object.fromEntries(keys.filter((k) => src?.[k] !== undefined).map((k) => [k, src[k]])) as Partial<T>;

const validateDog = (d: Partial<Dog>, creating: boolean) => {
  if (creating || d.name !== undefined) if (!String(d.name ?? '').trim()) fail(422, 'VALIDATION_ERROR', 'Dog name is required.');
  if (creating || d.ownerName !== undefined) if (!String(d.ownerName ?? '').trim()) fail(422, 'VALIDATION_ERROR', 'Owner name is required.');
  if (creating || d.ownerPhone !== undefined) if (!String(d.ownerPhone ?? '').trim()) fail(422, 'VALIDATION_ERROR', 'Owner phone is required.');
  if (d.gender !== undefined && !['male', 'female'].includes(d.gender)) fail(422, 'VALIDATION_ERROR', 'Invalid gender.');
  if (d.temperament !== undefined && !['friendly', 'shy', 'reactive'].includes(d.temperament)) fail(422, 'VALIDATION_ERROR', 'Invalid temperament.');
  if (d.status !== undefined && !['active', 'archived'].includes(d.status)) fail(422, 'VALIDATION_ERROR', 'Invalid status.');
};

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
};

// ---------- routes ----------
const STAFF: Role[] = ['admin', 'staff'];

const routes: Array<[string, string, Handler]> = [
  // Auth
  ['POST', '/auth/login', ({ body }) => {
    const user = db.users.find((u) => u.email.toLowerCase() === String(body?.email ?? '').toLowerCase());
    if (!user || user.password !== body?.password) fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    if (user!.status !== 'active') fail(403, 'ACCOUNT_INACTIVE', 'This account is inactive. Contact support.');
    return ok(tokens(user!));
  }],
  ['POST', '/auth/register', ({ body }) => {
    if (!body?.name || !body?.email || !body?.password) fail(422, 'VALIDATION_ERROR', 'Name, email and password are required.');
    if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) fail(422, 'EMAIL_TAKEN', 'This email is already registered.');
    const user: MockUser = {
      id: newId('u'), name: body.name, email: body.email, password: body.password, role: 'user',
      phone: body.phone ?? null, avatarUrl: null, status: 'active', createdAt: nowIso(),
    };
    db.users.push(user);
    return ok(tokens(user), 201);
  }],
  ['POST', '/auth/refresh', ({ body }) => {
    const user = userFromToken(body?.refreshToken ?? null, 'refresh') ?? fail(401, 'INVALID_TOKEN', 'Session expired.');
    return ok({ accessToken: `mock-access-${user.id}` });
  }],
  ['POST', '/auth/logout', (ctx) => (requireUser(ctx), ok({ success: true }))],
  ['GET', '/me', (ctx) => ok(publicUser(requireUser(ctx)))],
  ['PATCH', '/me', (ctx) => {
    const user = requireUser(ctx);
    const { name, phone, avatarUrl } = ctx.body ?? {};
    Object.assign(user, name !== undefined && { name }, phone !== undefined && { phone }, avatarUrl !== undefined && { avatarUrl });
    return ok(publicUser(user));
  }],

  // Users (admin)
  ['GET', '/users', (ctx) => {
    requireUser(ctx, ['admin']);
    const { role, status, search } = ctx.query;
    const s = search?.toLowerCase();
    const items = db.users
      .filter((u) => (!role || u.role === role) && (!status || u.status === status))
      .filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
      .map(publicUser);
    return list(items, ctx.query);
  }],
  ['GET', '/users/:id', (ctx) => (requireUser(ctx, ['admin']), ok(publicUser(findOr404(db.users, ctx.params.id, 'User'))))],
  ['PATCH', '/users/:id', (ctx) => {
    requireUser(ctx, ['admin']);
    const user = findOr404(db.users, ctx.params.id, 'User');
    const { role, status } = ctx.body ?? {};
    if (role && !['admin', 'user', 'staff'].includes(role)) fail(422, 'VALIDATION_ERROR', 'Invalid role.');
    if (status && !['active', 'inactive'].includes(status)) fail(422, 'VALIDATION_ERROR', 'Invalid status.');
    Object.assign(user, role && { role }, status && { status });
    return ok(publicUser(user));
  }],

  // Dogs
  ['GET', '/dogs', (ctx) => {
    requireUser(ctx, STAFF);
    const status = ctx.query.status ?? 'active';
    const s = ctx.query.search?.trim().toLowerCase();
    const items = db.dogs
      .filter((d) => status === 'all' || d.status === status)
      .filter((d) => !s || [d.name, d.breed, d.ownerName, d.ownerPhone].some((v) => v.toLowerCase().includes(s)))
      .sort((a, b) => a.name.localeCompare(b.name));
    return list(items, ctx.query);
  }],
  ['GET', '/dogs/:id', (ctx) => (requireUser(ctx, STAFF), ok(findOr404(db.dogs, ctx.params.id, 'Dog')))],
  ['POST', '/dogs', (ctx) => {
    requireUser(ctx, ['admin']);
    const input = pick<Dog>(ctx.body, DOG_FIELDS);
    validateDog(input, true);
    const now = nowIso();
    const dog: Dog = {
      id: newId('d'), name: '', breed: '', gender: 'male', dateOfBirth: null, weightKg: null, color: '',
      ownerId: null, ownerName: '', ownerPhone: '', vaccinated: false, vaccinationExpiry: null, neutered: false,
      temperament: 'friendly', feedingNotes: '', medicalNotes: '', notes: '', photoUrl: null, status: 'active',
      ...input, createdAt: now, updatedAt: now,
    };
    dog.name = dog.name.trim();
    db.dogs.push(dog);
    return ok(dog, 201);
  }],
  ['PATCH', '/dogs/:id', (ctx) => {
    requireUser(ctx, ['admin']);
    const dog = findOr404(db.dogs, ctx.params.id, 'Dog');
    const changes = pick<Dog>(ctx.body, DOG_FIELDS);
    validateDog(changes, false);
    if (changes.status === 'archived') {
      const open = db.bookings.some((b) => b.dogId === dog.id && OPEN.includes(b.status));
      if (open) fail(422, 'HAS_OPEN_BOOKINGS', `${dog.name} has upcoming or active bookings. Cancel or finish them first.`);
    }
    Object.assign(dog, changes, { updatedAt: nowIso() });
    return ok(dog);
  }],

  // Bookings
  ['GET', '/bookings', (ctx) => {
    requireUser(ctx, STAFF);
    const { from, to, status, dogId, paymentStatus } = ctx.query;
    const f = from ? ms(from) : -Infinity;
    const t = to ? ms(to) : Infinity;
    const items = db.bookings
      .filter((b) => overlaps(f, t, ms(b.checkIn), ms(b.checkOut)))
      .filter((b) => (!status || b.status === status) && (!dogId || b.dogId === dogId))
      .sort(byCheckIn)
      .map(withDog)
      .filter((b) => !paymentStatus || (paymentStatus === 'due' ? b.balanceDue > 0 : b.paymentStatus === paymentStatus));
    return list(items, ctx.query);
  }],
  ['GET', '/bookings/:id', (ctx) => (requireUser(ctx, STAFF), ok(withDog(findOr404(db.bookings, ctx.params.id, 'Booking'))))],
  ['POST', '/bookings', (ctx) => {
    const user = requireUser(ctx, ['admin']);
    const { dogId, checkIn, checkOut, kennel, pricePerNight, notes } = ctx.body ?? {};
    validateStay({ dogId, checkIn, checkOut });
    const price = Number(pricePerNight ?? db.settings.pricePerNight);
    if (!(price >= 0)) fail(422, 'VALIDATION_ERROR', 'Price per night must be a positive number.');
    const nights = nightsBetween(checkIn, checkOut);
    const now = nowIso();
    const booking: StoredBooking = {
      id: newId('b'), dogId, checkIn: new Date(checkIn).toISOString(), checkOut: new Date(checkOut).toISOString(),
      status: 'confirmed', kennel: kennel || null, nights, pricePerNight: price, totalAmount: nights * price,
      currency: db.settings.currency, notes: notes ?? '', source: 'admin', createdBy: user.id, createdAt: now, updatedAt: now,
      payments: [],
    };
    db.bookings.push(booking);
    return ok(withDog(booking), 201);
  }],
  ['PATCH', '/bookings/:id', (ctx) => {
    requireUser(ctx, ['admin']);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    if (booking.status === 'checked_out' || booking.status === 'cancelled') fail(422, 'INVALID_STATE', `Booking is already ${booking.status.replace('_', ' ')}.`);
    const b = ctx.body ?? {};
    const next = {
      dogId: b.dogId ?? booking.dogId,
      checkIn: b.checkIn ? new Date(b.checkIn).toISOString() : booking.checkIn,
      checkOut: b.checkOut ? new Date(b.checkOut).toISOString() : booking.checkOut,
    };
    if (booking.status === 'checked_in' && next.dogId !== booking.dogId) fail(422, 'INVALID_STATE', 'Cannot change the dog after check-in.');
    validateStay(next, booking.id);
    const price = b.pricePerNight !== undefined ? Number(b.pricePerNight) : booking.pricePerNight;
    if (!(price >= 0)) fail(422, 'VALIDATION_ERROR', 'Price per night must be a positive number.');
    const nights = nightsBetween(next.checkIn, next.checkOut);
    Object.assign(booking, next, {
      kennel: b.kennel !== undefined ? b.kennel || null : booking.kennel,
      notes: b.notes ?? booking.notes,
      pricePerNight: price, nights, totalAmount: nights * price, updatedAt: nowIso(),
    });
    return ok(withDog(booking));
  }],
  ['PATCH', '/bookings/:id/status', (ctx) => {
    requireUser(ctx, STAFF);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    const next = ctx.body?.status as BookingStatus;
    if (!ALLOWED_TRANSITIONS[booking.status].includes(next)) {
      fail(422, 'INVALID_STATE', `Cannot change a ${booking.status.replace('_', ' ')} booking to ${String(next).replace('_', ' ')}.`);
    }
    if (next === 'checked_in' && db.bookings.filter((b) => b.status === 'checked_in').length >= db.settings.capacity) {
      fail(422, 'CAPACITY_FULL', `Boarding is full (${db.settings.capacity} dogs checked in).`);
    }
    booking.status = next;
    booking.updatedAt = nowIso();
    return ok(withDog(booking));
  }],

  // Payments on a booking
  ['POST', '/bookings/:id/payments', (ctx) => {
    const user = requireUser(ctx, ['admin']);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    const { amount, type = 'payment', method = 'cash', note = '', receivedAt } = ctx.body ?? {};
    const value = Number(amount);
    if (!(value > 0)) fail(422, 'VALIDATION_ERROR', 'Enter an amount above 0.');
    if (!['advance', 'payment', 'refund'].includes(type)) fail(422, 'VALIDATION_ERROR', 'Invalid payment type.');
    if (!['cash', 'upi', 'card', 'bank'].includes(method)) fail(422, 'VALIDATION_ERROR', 'Invalid payment method.');
    const { amountPaid, balanceDue } = paymentTotals(booking);
    if (type === 'refund' && value > amountPaid) fail(422, 'VALIDATION_ERROR', `Refund can't be more than the ₹${amountPaid} received.`);
    if (type !== 'refund' && booking.status === 'cancelled') fail(422, 'INVALID_STATE', 'This booking is cancelled - record a refund instead.');
    if (type !== 'refund' && value > balanceDue) {
      fail(422, 'OVERPAYMENT', `Only ₹${Math.max(0, balanceDue)} is due on this booking.`, { balanceDue });
    }
    const at = receivedAt ? new Date(receivedAt) : new Date();
    if (Number.isNaN(at.getTime())) fail(422, 'VALIDATION_ERROR', 'Invalid payment date.');
    booking.payments.push({ id: newId('p'), amount: value, type, method, note: String(note).trim(), receivedAt: at.toISOString(), recordedBy: user.id });
    booking.updatedAt = nowIso();
    return ok(withDog(booking), 201);
  }],
  ['DELETE', '/bookings/:id/payments/:paymentId', (ctx) => {
    requireUser(ctx, ['admin']);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    findOr404(booking.payments, ctx.params.paymentId, 'Payment');
    booking.payments = booking.payments.filter((p) => p.id !== ctx.params.paymentId);
    booking.updatedAt = nowIso();
    return ok(withDog(booking));
  }],

  // Billing: stays that check in within [from, to)
  ['GET', '/admin/billing', (ctx) => {
    requireUser(ctx, ['admin']);
    const f = ctx.query.from ? ms(ctx.query.from) : -Infinity;
    const t = ctx.query.to ? ms(ctx.query.to) : Infinity;
    const inRange = db.bookings.filter((b) => b.status !== 'cancelled' && ms(b.checkIn) >= f && ms(b.checkIn) < t).map(withDog);
    const open = db.bookings.filter((b) => b.status !== 'cancelled').map(withDog).filter((b) => b.balanceDue > 0);
    return ok({
      from: ctx.query.from ?? null,
      to: ctx.query.to ?? null,
      currency: db.settings.currency,
      bookings: inRange.length,
      expected: inRange.reduce((n, b) => n + b.totalAmount, 0),
      received: inRange.reduce((n, b) => n + b.amountPaid, 0),
      due: inRange.reduce((n, b) => n + Math.max(0, b.balanceDue), 0),
      advances: inRange.reduce((n, b) => n + b.payments.filter((p) => p.type === 'advance').reduce((x, p) => x + p.amount, 0), 0),
      paidCount: inRange.filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'overpaid').length,
      partialCount: inRange.filter((b) => b.paymentStatus === 'partial').length,
      unpaidCount: inRange.filter((b) => b.paymentStatus === 'unpaid').length,
      outstandingAllTime: open.reduce((n, b) => n + b.balanceDue, 0),
      outstandingBookings: open.length,
      // Cash flow: money actually received in [from, to), for any stay (refunds subtract).
      ...(() => {
        const pays = db.bookings.flatMap((b) => b.payments).filter((p) => ms(p.receivedAt) >= f && ms(p.receivedAt) < t);
        return {
          collected: pays.reduce((n, p) => n + (p.type === 'refund' ? -p.amount : p.amount), 0),
          collectedCount: pays.length,
        };
      })(),
    });
  }],

  // Settings
  ['GET', '/settings', (ctx) => (requireUser(ctx, STAFF), ok(db.settings))],
  ['PATCH', '/settings', (ctx) => {
    requireUser(ctx, ['admin']);
    const { capacity, pricePerNight, defaultCheckInTime, defaultCheckOutTime, facilityName } = ctx.body ?? {};
    if (capacity !== undefined) {
      if (!(Number.isInteger(capacity) && capacity > 0 && capacity <= 500)) fail(422, 'VALIDATION_ERROR', 'Capacity must be a whole number between 1 and 500.');
      const checkedIn = db.bookings.filter((b) => b.status === 'checked_in').length;
      if (capacity < checkedIn) {
        fail(422, 'CAPACITY_BELOW_OCCUPANCY', `${checkedIn} dogs are checked in right now. Capacity can't be lower than that.`, { checkedIn });
      }
    }
    if (pricePerNight !== undefined && !(Number(pricePerNight) >= 0)) fail(422, 'VALIDATION_ERROR', 'Price per night must be 0 or more.');
    const isTime = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
    if (defaultCheckInTime !== undefined && !isTime(defaultCheckInTime)) fail(422, 'VALIDATION_ERROR', 'Check-in time must be HH:mm.');
    if (defaultCheckOutTime !== undefined && !isTime(defaultCheckOutTime)) fail(422, 'VALIDATION_ERROR', 'Check-out time must be HH:mm.');
    if (facilityName !== undefined && !String(facilityName).trim()) fail(422, 'VALIDATION_ERROR', 'Facility name is required.');
    Object.assign(
      db.settings,
      capacity !== undefined && { capacity },
      pricePerNight !== undefined && { pricePerNight: Number(pricePerNight) },
      defaultCheckInTime !== undefined && { defaultCheckInTime },
      defaultCheckOutTime !== undefined && { defaultCheckOutTime },
      facilityName !== undefined && { facilityName: String(facilityName).trim() },
    );
    return ok(db.settings);
  }],

  // Occupancy calendar: per-day stats for [from, to) local dates (max 62 days)
  ['GET', '/admin/occupancy', (ctx) => {
    requireUser(ctx, STAFF);
    const from = parseDateKey(ctx.query.from);
    const to = parseDateKey(ctx.query.to);
    if (from === null || to === null || to <= from) fail(422, 'VALIDATION_ERROR', 'from and to must be YYYY-MM-DD with to after from.');
    const days: ReturnType<typeof dayStats>[] = [];
    for (let d = new Date(from!); d.getTime() < to! && days.length < 62; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      days.push(dayStats(d.getTime()));
    }
    return ok({ capacity: db.settings.capacity, days });
  }],

  // Dashboard
  ['GET', '/admin/dashboard', (ctx) => {
    requireUser(ctx, STAFF);
    const now = Date.now();
    const todayStart = startOfLocalDay(new Date()).getTime();
    const todayEnd = todayStart + DAY;
    const occupiedNow = db.bookings.filter((b) => b.status === 'checked_in').length;
    const inRange = (iso: string, a: number, b: number) => ms(iso) >= a && ms(iso) < b;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime();

    return ok({
      capacity: db.settings.capacity,
      occupiedNow,
      availableNow: Math.max(0, db.settings.capacity - occupiedNow),
      todayCheckIns: db.bookings
        .filter((b) => ['confirmed', 'checked_in', 'checked_out'].includes(b.status) && inRange(b.checkIn, todayStart, todayEnd))
        .sort(byCheckIn).map(withDog),
      todayCheckOuts: db.bookings
        .filter((b) => ['checked_in', 'checked_out'].includes(b.status) && inRange(b.checkOut, todayStart, todayEnd))
        .sort((a, b) => a.checkOut.localeCompare(b.checkOut)).map(withDog),
      upcoming: db.bookings
        .filter((b) => b.status === 'confirmed' && inRange(b.checkIn, now, now + 7 * DAY))
        .sort(byCheckIn).map(withDog),
      occupancyNext7Days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(todayStart);
        const s0 = dayStats(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i).getTime());
        return { date: s0.date, count: s0.occupied };
      }),
      activeDogs: db.dogs.filter((d) => d.status === 'active').length,
      bookingsThisMonth: db.bookings.filter((b) => b.status !== 'cancelled' && overlaps(monthStart, monthEnd, ms(b.checkIn), ms(b.checkOut))).length,
      ...(() => {
        const due = db.bookings.filter((b) => b.status !== 'cancelled').map(withDog).filter((b) => b.balanceDue > 0);
        return { paymentsDue: due.reduce((n, b) => n + b.balanceDue, 0), paymentsDueBookings: due.length };
      })(),
    });
  }],
];

// ---------- matcher ----------
const compiled = routes.map(([method, pattern, handler]) => {
  const keys: string[] = [];
  const regex = new RegExp('^' + pattern.replace(/:([A-Za-z]+)/g, (_, k: string) => (keys.push(k), '([^/]+)')) + '/?$');
  return { method, regex, keys, handler };
});

export function handleMockRequest(req: MockRequest): MockResponse {
  const method = req.method.toUpperCase();
  const candidates = compiled.filter((r) => r.regex.test(req.path));
  if (candidates.length === 0) return { status: 404, data: { error: { code: 'ROUTE_NOT_FOUND', message: `No mock for ${method} ${req.path}` } } };
  const route = candidates.find((r) => r.method === method);
  if (!route) return { status: 405, data: { error: { code: 'METHOD_NOT_ALLOWED', message: `${method} not allowed on ${req.path}` } } };

  const match = route.regex.exec(req.path)!;
  const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
  try {
    return route.handler({ ...req, params, user: userFromToken(req.token) });
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, data: { error: { code: e.code, message: e.message, details: e.details } } };
    return { status: 500, data: { error: { code: 'MOCK_ERROR', message: (e as Error).message } } };
  }
}
