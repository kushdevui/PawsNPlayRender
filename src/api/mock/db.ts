// In-memory copy of mock/data/*.json. Mutations last until the app reloads.
import usersJson from '../../../mock/data/users.json';
import dogsJson from '../../../mock/data/dogs.json';
import bookingsJson from '../../../mock/data/bookings.json';
import settingsJson from '../../../mock/data/settings.json';
import type { Booking, Dog, FacilitySettings, User } from '../types';

export type MockUser = User & { password: string };
/** Stored booking = API booking without the joined `dog` summary. */
export type StoredBooking = Omit<Booking, 'dog'>;

const clone = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;

export const db = {
  users: clone<MockUser[]>(usersJson),
  dogs: clone<Dog[]>(dogsJson),
  bookings: clone<StoredBooking[]>(bookingsJson),
  settings: clone<FacilitySettings>(settingsJson),
};

export const resetDb = () => {
  db.users = clone(usersJson);
  db.dogs = clone(dogsJson);
  db.bookings = clone(bookingsJson);
  db.settings = clone(settingsJson);
};

let seq = 1000;
export const newId = (prefix: string) => `${prefix}_${++seq}`;

export const publicUser = ({ password: _pw, ...user }: MockUser): User => user;
