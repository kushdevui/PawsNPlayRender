// One function per endpoint. Screens use these through TanStack Query hooks,
// never axios directly. Same code works with mocks and with the real backend.
// Responses pass through ../normalize so a server shape that differs from the contract
// never crashes a screen (missing fields get defaults + a dev warning).
import { appendFile, multipartConfig, type LocalFile } from '@/lib/attachments';
import { API_URL, USE_MOCKS, api, getAccessToken } from '../client';
import {
  normalizeAuth, normalizeBilling, normalizeBooking, normalizeCurrentWaiver, normalizeDashboard, normalizeDog, normalizeOccupancy,
  normalizeQuestionnaire, normalizeQuestionnaireListItem, normalizeSettings, normalizeUser, normalizeWaiver, normalizeWaiverListItem,
  normalizeWaiverReceipt,
} from '../normalize';
import type {
  ApiList, AuthResponse, BillingSummary, Booking, BookingFilters, BookingInput, BookingStatus, PaymentInput,
  DashboardStats, Dog, DogInput, DogStatus, FacilitySettings, ListParams, OccupancyCalendar, Questionnaire, QuestionnaireAnswers,
  QuestionnaireFilters, QuestionnaireListItem, QuestionnaireReceipt, QuestionnaireUpdate, Role, User, UserStatus, CurrentWaiver,
  Waiver, WaiverFilters, WaiverListItem, WaiverReceipt, WaiverSubmission, WaiverUpdate,
} from '../types';

/** Unwrap `{ data }` (or a bare object, if the server skips the envelope). */
const item = <T>(p: Promise<{ data: any }>, map: (raw: any) => T = (x) => x as T) =>
  p.then((r) => map(r.data && typeof r.data === 'object' && 'data' in r.data ? r.data.data : r.data));

/** Unwrap `{ data: [], meta }` (or a bare array). */
const list = <T>(p: Promise<{ data: any }>, map: (raw: any) => T = (x) => x as T): Promise<ApiList<T>> =>
  p.then((r) => {
    const body = r.data;
    const rows: any[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    const meta = body?.meta ?? { total: rows.length, page: 1, limit: rows.length };
    return { data: rows.map(map), meta };
  });

export const authApi = {
  login: (email: string, password: string) => item<AuthResponse>(api.post('/auth/login', { email, password }), normalizeAuth),
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    item<AuthResponse>(api.post('/auth/register', body), normalizeAuth),
  refresh: (refreshToken: string) => item<{ accessToken: string }>(api.post('/auth/refresh', { refreshToken })),
  logout: () => item<{ success: boolean }>(api.post('/auth/logout')),
  me: () => item<User>(api.get('/me'), normalizeUser),
  updateMe: (body: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl'>>) => item<User>(api.patch('/me', body), normalizeUser),
};

export const usersApi = {
  list: (params?: ListParams & { role?: Role; status?: UserStatus; search?: string }) =>
    list<User>(api.get('/users', { params }), normalizeUser),
  get: (id: string) => item<User>(api.get(`/users/${id}`), normalizeUser),
  update: (id: string, body: { role?: Role; status?: UserStatus }) => item<User>(api.patch(`/users/${id}`, body), normalizeUser),
};

export const dogsApi = {
  list: (params?: ListParams & { search?: string; status?: DogStatus }) => list<Dog>(api.get('/dogs', { params }), normalizeDog),
  get: (id: string) => item<Dog>(api.get(`/dogs/${id}`), normalizeDog),
  create: (body: DogInput) => item<Dog>(api.post('/dogs', body), normalizeDog),
  update: (id: string, body: Partial<DogInput>) => item<Dog>(api.patch(`/dogs/${id}`, body), normalizeDog),
};

export const bookingsApi = {
  list: (params?: ListParams & BookingFilters) => list<Booking>(api.get('/bookings', { params }), normalizeBooking),
  get: (id: string) => item<Booking>(api.get(`/bookings/${id}`), normalizeBooking),
  create: (body: BookingInput) => item<Booking>(api.post('/bookings', body), normalizeBooking),
  update: (id: string, body: Partial<BookingInput>) => item<Booking>(api.patch(`/bookings/${id}`, body), normalizeBooking),
  setStatus: (id: string, status: Exclude<BookingStatus, 'pending'>) =>
    item<Booking>(api.patch(`/bookings/${id}/status`, { status }), normalizeBooking),
  addPayment: (id: string, body: PaymentInput) => item<Booking>(api.post(`/bookings/${id}/payments`, body), normalizeBooking),
  removePayment: (id: string, paymentId: string) =>
    item<Booking>(api.delete(`/bookings/${id}/payments/${paymentId}`), normalizeBooking),
};

export const settingsApi = {
  get: () => item<FacilitySettings>(api.get('/settings'), normalizeSettings),
  update: (body: Partial<FacilitySettings>) => item<FacilitySettings>(api.patch('/settings', body), normalizeSettings),
};

export const adminApi = {
  dashboard: () => item<DashboardStats>(api.get('/admin/dashboard'), normalizeDashboard),
  /** Billing for stays checking in within [from, to) (ISO). */
  billing: (from: string, to: string) =>
    item<BillingSummary>(api.get('/admin/billing', { params: { from, to } }), normalizeBilling),
  /** Per-day occupancy for local dates [from, to), 'YYYY-MM-DD'. */
  occupancy: (from: string, to: string) =>
    item<OccupancyCalendar>(api.get('/admin/occupancy', { params: { from, to } }), normalizeOccupancy),
};

/**
 * "Know Your Dog" questionnaires (BACKEND_API_SPEC §7.12).
 * submit: public form (no login), multipart `answers` (JSON string), `website` (honeypot), `documents` files.
 * list / get: admin + staff. update (status, linked dog): admin.
 */
export const questionnairesApi = {
  list: (params?: ListParams & QuestionnaireFilters) =>
    list<QuestionnaireListItem>(api.get('/questionnaires', { params }), normalizeQuestionnaireListItem),
  get: (id: string) => item<Questionnaire>(api.get(`/questionnaires/${id}`), normalizeQuestionnaire),
  update: (id: string, body: QuestionnaireUpdate) => item<Questionnaire>(api.patch(`/questionnaires/${id}`, body), normalizeQuestionnaire),
  submit: async (answers: QuestionnaireAnswers, files: LocalFile[], website = '') => {
    const form = new FormData();
    form.append('answers', JSON.stringify(answers));
    form.append('website', website);
    for (const file of files) await appendFile(form, 'documents', file);
    return item<QuestionnaireReceipt>(api.post('/questionnaires', form, multipartConfig()));
  },
};

/**
 * "Boarding Consent & Waiver". The text is owned and versioned by the server (GET /waivers/current);
 * submit is public (JSON, one call). list / get: admin + staff. update (linked dog / form): admin.
 */
export const waiversApi = {
  current: () => item<CurrentWaiver>(api.get('/waivers/current'), normalizeCurrentWaiver),
  submit: (body: WaiverSubmission) => item<WaiverReceipt>(api.post('/waivers', body), normalizeWaiverReceipt),
  list: (params?: ListParams & WaiverFilters) => list<WaiverListItem>(api.get('/waivers', { params }), normalizeWaiverListItem),
  get: (id: string) => item<Waiver>(api.get(`/waivers/${id}`), normalizeWaiver),
  update: (id: string, body: WaiverUpdate) => item<Waiver>(api.patch(`/waivers/${id}`, body), normalizeWaiver),
  /** Printable HTML of a signed waiver, opened in the browser. The browser can't send our header, so the token
   *  goes in the query string. null in mock mode (there is no server to render it). */
  documentUrl: (id: string): string | null => {
    if (USE_MOCKS) return null;
    const token = getAccessToken();
    return `${API_URL}/waivers/${encodeURIComponent(id)}/document${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};
