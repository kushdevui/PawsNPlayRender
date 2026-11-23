// Shared API types. Keep in sync with mock/endpoints.json and the Node backend.

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

export type Species = 'dog' | 'cat';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  weightKg: number;
  vaccinated: boolean;
  notes: string;
  photoUrl: string | null;
  createdAt: string;
}
export type PetInput = Omit<Pet, 'id' | 'ownerId' | 'createdAt'> & { ownerId?: string };

export type ServiceCategory = 'daycare' | 'grooming' | 'play' | 'walking' | 'training';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  speciesAllowed: Species[];
  active: boolean;
}
export type ServiceInput = Omit<Service, 'id'>;

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  petId: string;
  serviceId: string;
  staffId: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
}
export interface BookingInput {
  petId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'booking' | 'promo' | 'reminder' | 'assignment' | 'system';
  title: string;
  body: string;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStaff: number;
  totalPets: number;
  bookingsByStatus: Record<BookingStatus, number>;
  revenue: { amount: number; currency: string };
  upcomingBookings: Booking[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Response envelopes
export interface ApiItem<T> {
  data: T;
}
export interface ApiList<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}
export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface ListParams {
  page?: number;
  limit?: number;
}
