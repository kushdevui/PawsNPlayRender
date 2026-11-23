// Central query keys so invalidation stays consistent.
export const queryKeys = {
  dogs: (params?: object) => ['dogs', 'list', params ?? {}] as const,
  dog: (id: string) => ['dogs', 'detail', id] as const,
  bookings: (params?: object) => ['bookings', 'list', params ?? {}] as const,
  booking: (id: string) => ['bookings', 'detail', id] as const,
  settings: ['settings'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  users: (params?: object) => ['users', params ?? {}] as const,
};
