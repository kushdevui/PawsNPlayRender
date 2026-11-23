// Mock route handlers. Mirrors mock/endpoints.json. No axios here, so it is easy to unit test.
import { db, newId, publicUser, type MockUser } from './db';
import type { Booking, BookingStatus, Role } from '../types';

export interface MockRequest {
  method: string;
  path: string; // e.g. /pets/p_001 (no base URL, no query string)
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
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
const ok = (data: unknown, status = 200): MockResponse => ({ status, data: { data } });
const fail = (status: number, code: string, message: string): never => {
  throw new HttpError(status, code, message);
};

const requireUser = (ctx: Ctx, roles?: Role[]): MockUser => {
  if (!ctx.user) return fail(401, 'UNAUTHORIZED', 'Please log in again.');
  if (roles && !roles.includes(ctx.user.role)) return fail(403, 'FORBIDDEN', 'You do not have access to this.');
  return ctx.user;
};

const list = <T>(items: T[], query: Record<string, string>): MockResponse => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
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

const canSeeBooking = (user: MockUser, b: Booking) =>
  user.role === 'admin' || (user.role === 'staff' ? b.staffId === user.id : b.userId === user.id);

const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

// ---------- routes ----------
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
      phone: body.phone ?? null, avatarUrl: null, status: 'active', createdAt: new Date().toISOString(),
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

  // Pets
  ['GET', '/pets', (ctx) => {
    const user = requireUser(ctx);
    const { species, ownerId } = ctx.query;
    const items = db.pets
      .filter((p) => user.role !== 'user' || p.ownerId === user.id)
      .filter((p) => (!species || p.species === species) && (!ownerId || p.ownerId === ownerId));
    return list(items, ctx.query);
  }],
  ['GET', '/pets/:id', (ctx) => {
    const user = requireUser(ctx);
    const pet = findOr404(db.pets, ctx.params.id, 'Pet');
    if (user.role === 'user' && pet.ownerId !== user.id) fail(404, 'NOT_FOUND', 'Pet not found');
    return ok(pet);
  }],
  ['POST', '/pets', (ctx) => {
    const user = requireUser(ctx, ['user', 'admin']);
    const b = ctx.body ?? {};
    if (!b.name || !b.species) fail(422, 'VALIDATION_ERROR', 'Name and species are required.');
    const pet = {
      id: newId('p'), ownerId: user.role === 'admin' && b.ownerId ? b.ownerId : user.id,
      name: b.name, species: b.species, breed: b.breed ?? '', gender: b.gender ?? 'male',
      dateOfBirth: b.dateOfBirth ?? '', weightKg: Number(b.weightKg) || 0, vaccinated: !!b.vaccinated,
      notes: b.notes ?? '', photoUrl: b.photoUrl ?? null, createdAt: new Date().toISOString(),
    };
    db.pets.push(pet);
    return ok(pet, 201);
  }],
  ['PATCH', '/pets/:id', (ctx) => {
    const user = requireUser(ctx, ['user', 'admin']);
    const pet = findOr404(db.pets, ctx.params.id, 'Pet');
    if (user.role === 'user' && pet.ownerId !== user.id) fail(404, 'NOT_FOUND', 'Pet not found');
    const { id: _i, ownerId: _o, createdAt: _c, ...changes } = ctx.body ?? {};
    Object.assign(pet, changes);
    return ok(pet);
  }],
  ['DELETE', '/pets/:id', (ctx) => {
    const user = requireUser(ctx, ['user', 'admin']);
    const pet = findOr404(db.pets, ctx.params.id, 'Pet');
    if (user.role === 'user' && pet.ownerId !== user.id) fail(404, 'NOT_FOUND', 'Pet not found');
    db.pets = db.pets.filter((p) => p.id !== pet.id);
    return ok({ success: true });
  }],

  // Services
  ['GET', '/services', (ctx) => {
    const user = requireUser(ctx);
    const { category } = ctx.query;
    const items = db.services
      .filter((s) => user.role === 'admin' || s.active)
      .filter((s) => !category || s.category === category);
    return list(items, ctx.query);
  }],
  ['GET', '/services/:id', (ctx) => {
    const user = requireUser(ctx);
    const service = findOr404(db.services, ctx.params.id, 'Service');
    if (!service.active && user.role !== 'admin') fail(404, 'NOT_FOUND', 'Service not found');
    return ok(service);
  }],
  ['POST', '/services', (ctx) => {
    requireUser(ctx, ['admin']);
    const b = ctx.body ?? {};
    if (!b.name || !b.category || !b.price) fail(422, 'VALIDATION_ERROR', 'Name, category and price are required.');
    const service = {
      id: newId('s'), name: b.name, category: b.category, description: b.description ?? '',
      durationMinutes: Number(b.durationMinutes) || 60, price: Number(b.price), currency: b.currency ?? 'INR',
      speciesAllowed: b.speciesAllowed ?? ['dog', 'cat'], active: b.active ?? true,
    };
    db.services.push(service);
    return ok(service, 201);
  }],
  ['PATCH', '/services/:id', (ctx) => {
    requireUser(ctx, ['admin']);
    const service = findOr404(db.services, ctx.params.id, 'Service');
    const { id: _i, ...changes } = ctx.body ?? {};
    Object.assign(service, changes);
    return ok(service);
  }],

  // Bookings
  ['GET', '/bookings', (ctx) => {
    const user = requireUser(ctx);
    const { status, from, to } = ctx.query;
    const items = db.bookings
      .filter((b) => canSeeBooking(user, b))
      .filter((b) => (!status || b.status === status) && (!from || b.startTime >= from) && (!to || b.startTime <= to))
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
    return list(items, ctx.query);
  }],
  ['GET', '/bookings/:id', (ctx) => {
    const user = requireUser(ctx);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    if (!canSeeBooking(user, booking)) fail(404, 'NOT_FOUND', 'Booking not found');
    return ok(booking);
  }],
  ['POST', '/bookings', (ctx) => {
    const user = requireUser(ctx, ['user']);
    const { petId, serviceId, startTime, notes } = ctx.body ?? {};
    if (!petId || !serviceId || !startTime) fail(422, 'VALIDATION_ERROR', 'Pet, service and start time are required.');
    const pet = db.pets.find((p) => p.id === petId && p.ownerId === user.id) ?? fail(422, 'VALIDATION_ERROR', 'Choose one of your pets.');
    const service = db.services.find((s) => s.id === serviceId && s.active) ?? fail(422, 'VALIDATION_ERROR', 'Service is not available.');
    if (!service.speciesAllowed.includes(pet.species)) fail(422, 'VALIDATION_ERROR', `${service.name} is not available for ${pet.species}s.`);
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) fail(422, 'VALIDATION_ERROR', 'Pick a future date and time.');
    const booking: Booking = {
      id: newId('b'), userId: user.id, petId, serviceId, staffId: null,
      startTime: start.toISOString(), endTime: new Date(start.getTime() + service.durationMinutes * 60000).toISOString(),
      status: 'pending', notes: notes ?? '', totalPrice: service.price, currency: service.currency,
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    return ok(booking, 201);
  }],
  ['PATCH', '/bookings/:id/status', (ctx) => {
    const user = requireUser(ctx);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    if (!canSeeBooking(user, booking)) fail(404, 'NOT_FOUND', 'Booking not found');
    const next = ctx.body?.status as BookingStatus;
    const allowed: Record<Role, BookingStatus[]> = { admin: ['confirmed', 'completed', 'cancelled'], staff: ['completed'], user: ['cancelled'] };
    if (!allowed[user.role].includes(next)) fail(403, 'FORBIDDEN', `You cannot set status to "${next}".`);
    if (booking.status === 'completed' || booking.status === 'cancelled') fail(422, 'INVALID_STATE', `Booking is already ${booking.status}.`);
    if (next === 'completed' && booking.status !== 'confirmed') fail(422, 'INVALID_STATE', 'Only confirmed bookings can be completed.');
    booking.status = next;
    return ok(booking);
  }],
  ['PATCH', '/bookings/:id/assign', (ctx) => {
    requireUser(ctx, ['admin']);
    const booking = findOr404(db.bookings, ctx.params.id, 'Booking');
    const staff = db.users.find((u) => u.id === ctx.body?.staffId && u.role === 'staff' && u.status === 'active');
    if (!staff) fail(422, 'VALIDATION_ERROR', 'Choose an active staff member.');
    booking.staffId = staff!.id;
    return ok(booking);
  }],

  // Notifications
  ['GET', '/notifications', (ctx) => {
    const user = requireUser(ctx);
    const unread = ctx.query.unread;
    const items = db.notifications
      .filter((n) => n.userId === user.id && (unread === undefined || n.read === (unread !== 'true')))
      .sort(byNewest);
    return list(items, ctx.query);
  }],
  ['PATCH', '/notifications/:id/read', (ctx) => {
    const user = requireUser(ctx);
    const n = findOr404(db.notifications.filter((x) => x.userId === user.id), ctx.params.id, 'Notification');
    n.read = true;
    return ok(n);
  }],

  // Admin
  ['GET', '/admin/dashboard', (ctx) => {
    requireUser(ctx, ['admin']);
    const bookingsByStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    db.bookings.forEach((b) => bookingsByStatus[b.status]++);
    const now = new Date().toISOString();
    return ok({
      totalUsers: db.users.filter((u) => u.role === 'user').length,
      totalStaff: db.users.filter((u) => u.role === 'staff').length,
      totalPets: db.pets.length,
      bookingsByStatus,
      revenue: {
        amount: db.bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.totalPrice, 0),
        currency: 'INR',
      },
      upcomingBookings: db.bookings
        .filter((b) => b.startTime >= now && (b.status === 'pending' || b.status === 'confirmed'))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 5),
    });
  }],
];

// ---------- matcher ----------
const compiled = routes.map(([method, pattern, handler]) => {
  const keys: string[] = [];
  const regex = new RegExp(
    '^' + pattern.replace(/:([A-Za-z]+)/g, (_, k: string) => (keys.push(k), '([^/]+)')) + '/?$',
  );
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
    if (e instanceof HttpError) return { status: e.status, data: { error: { code: e.code, message: e.message } } };
    return { status: 500, data: { error: { code: 'MOCK_ERROR', message: (e as Error).message } } };
  }
}
