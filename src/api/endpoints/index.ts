// One function per endpoint. Screens use these through TanStack Query hooks,
// never axios directly. Same code works with mocks and with the real backend.
import { api } from '../client';
import type {
  ApiItem, ApiList, AppNotification, AuthResponse, Booking, BookingInput, BookingStatus,
  DashboardStats, ListParams, Pet, PetInput, Role, Service, ServiceCategory, ServiceInput,
  Species, User, UserStatus,
} from '../types';

const item = <T>(p: Promise<{ data: ApiItem<T> }>) => p.then((r) => r.data.data);
const list = <T>(p: Promise<{ data: ApiList<T> }>) => p.then((r) => r.data);

export const authApi = {
  login: (email: string, password: string) =>
    item<AuthResponse>(api.post('/auth/login', { email, password })),
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    item<AuthResponse>(api.post('/auth/register', body)),
  refresh: (refreshToken: string) =>
    item<{ accessToken: string }>(api.post('/auth/refresh', { refreshToken })),
  logout: () => item<{ success: boolean }>(api.post('/auth/logout')),
  me: () => item<User>(api.get('/me')),
  updateMe: (body: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl'>>) => item<User>(api.patch('/me', body)),
};

export const usersApi = {
  list: (params?: ListParams & { role?: Role; status?: UserStatus; search?: string }) =>
    list<User>(api.get('/users', { params })),
  get: (id: string) => item<User>(api.get(`/users/${id}`)),
  update: (id: string, body: { role?: Role; status?: UserStatus }) => item<User>(api.patch(`/users/${id}`, body)),
};

export const petsApi = {
  list: (params?: ListParams & { species?: Species; ownerId?: string }) => list<Pet>(api.get('/pets', { params })),
  get: (id: string) => item<Pet>(api.get(`/pets/${id}`)),
  create: (body: PetInput) => item<Pet>(api.post('/pets', body)),
  update: (id: string, body: Partial<PetInput>) => item<Pet>(api.patch(`/pets/${id}`, body)),
  remove: (id: string) => item<{ success: boolean }>(api.delete(`/pets/${id}`)),
};

export const servicesApi = {
  list: (params?: ListParams & { category?: ServiceCategory }) => list<Service>(api.get('/services', { params })),
  get: (id: string) => item<Service>(api.get(`/services/${id}`)),
  create: (body: ServiceInput) => item<Service>(api.post('/services', body)),
  update: (id: string, body: Partial<ServiceInput>) => item<Service>(api.patch(`/services/${id}`, body)),
};

export const bookingsApi = {
  list: (params?: ListParams & { status?: BookingStatus; from?: string; to?: string }) =>
    list<Booking>(api.get('/bookings', { params })),
  get: (id: string) => item<Booking>(api.get(`/bookings/${id}`)),
  create: (body: BookingInput) => item<Booking>(api.post('/bookings', body)),
  setStatus: (id: string, status: Exclude<BookingStatus, 'pending'>) =>
    item<Booking>(api.patch(`/bookings/${id}/status`, { status })),
  assign: (id: string, staffId: string) => item<Booking>(api.patch(`/bookings/${id}/assign`, { staffId })),
};

export const notificationsApi = {
  list: (params?: ListParams & { unread?: boolean }) => list<AppNotification>(api.get('/notifications', { params })),
  markRead: (id: string) => item<AppNotification>(api.patch(`/notifications/${id}/read`)),
};

export const adminApi = {
  dashboard: () => item<DashboardStats>(api.get('/admin/dashboard')),
};
