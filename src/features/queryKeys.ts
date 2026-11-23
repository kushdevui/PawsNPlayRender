// Central query keys so invalidation stays consistent.
export const queryKeys = {
  services: (params?: object) => ['services', params ?? {}] as const,
  pets: (params?: object) => ['pets', params ?? {}] as const,
  bookings: (params?: object) => ['bookings', params ?? {}] as const,
  users: (params?: object) => ['users', params ?? {}] as const,
  notifications: (params?: object) => ['notifications', params ?? {}] as const,
  dashboard: ['admin', 'dashboard'] as const,
};
