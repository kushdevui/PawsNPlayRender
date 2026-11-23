// One function per endpoint. Screens use these through TanStack Query hooks,
// never axios directly. Same code works with mocks and with the real backend.
import { api } from '../client';
import type {
  ApiItem, ApiList, AuthResponse, Booking, BookingFilters, BookingInput, BookingStatus,
  DashboardStats, Dog, DogInput, DogStatus, FacilitySettings, ListParams, Role, User, UserStatus,
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

export const dogsApi = {
  list: (params?: ListParams & { search?: string; status?: DogStatus }) => list<Dog>(api.get('/dogs', { params })),
  get: (id: string) => item<Dog>(api.get(`/dogs/${id}`)),
  create: (body: DogInput) => item<Dog>(api.post('/dogs', body)),
  update: (id: string, body: Partial<DogInput>) => item<Dog>(api.patch(`/dogs/${id}`, body)),
};

export const bookingsApi = {
  list: (params?: ListParams & BookingFilters) => list<Booking>(api.get('/bookings', { params })),
  get: (id: string) => item<Booking>(api.get(`/bookings/${id}`)),
  create: (body: BookingInput) => item<Booking>(api.post('/bookings', body)),
  update: (id: string, body: Partial<BookingInput>) => item<Booking>(api.patch(`/bookings/${id}`, body)),
  setStatus: (id: string, status: Exclude<BookingStatus, 'pending'>) =>
    item<Booking>(api.patch(`/bookings/${id}/status`, { status })),
};

export const settingsApi = {
  get: () => item<FacilitySettings>(api.get('/settings')),
  update: (body: Partial<FacilitySettings>) => item<FacilitySettings>(api.patch('/settings', body)),
};

export const adminApi = {
  dashboard: () => item<DashboardStats>(api.get('/admin/dashboard')),
};
