// Central query keys so invalidation stays consistent.
export const queryKeys = {
  dogs: (params?: object) => ['dogs', 'list', params ?? {}] as const,
  dog: (id: string) => ['dogs', 'detail', id] as const,
  bookings: (params?: object) => ['bookings', 'list', params ?? {}] as const,
  booking: (id: string) => ['bookings', 'detail', id] as const,
  settings: ['settings'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  occupancy: (from: string, to: string) => ['admin', 'occupancy', from, to] as const,
  billing: (from: string, to: string) => ['admin', 'billing', from, to] as const,
  users: (params?: object) => ['users', params ?? {}] as const,
  questionnaires: (params?: object) => ['questionnaires', 'list', params ?? {}] as const,
  questionnaire: (id: string) => ['questionnaires', 'detail', id] as const,
};
