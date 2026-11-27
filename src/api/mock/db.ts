// In-memory copy of mock/data/*.json. Mutations last until the app reloads.
import usersJson from '../../../mock/data/users.json';
import dogsJson from '../../../mock/data/dogs.json';
import bookingsJson from '../../../mock/data/bookings.json';
import settingsJson from '../../../mock/data/settings.json';
import questionnairesJson from '../../../mock/data/questionnaires.json';
import waiversJson from '../../../mock/data/waivers.json';
import type { Booking, CurrentWaiver, Dog, FacilitySettings, Questionnaire, User, Waiver } from '../types';

export type MockUser = User & { password: string };
/** Stored booking = API booking without the joined `dog` summary and derived payment totals. */
export type StoredBooking = Omit<Booking, 'dog' | 'amountPaid' | 'balanceDue' | 'paymentStatus'>;
/** Stored waiver = API detail (the mock keeps no text snapshot). */
export type StoredWaiver = Omit<Waiver, 'content'>;

const clone = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;

export const db = {
  users: clone<MockUser[]>(usersJson),
  dogs: clone<Dog[]>(dogsJson),
  bookings: clone<StoredBooking[]>(bookingsJson),
  settings: clone<FacilitySettings>(settingsJson),
  questionnaires: clone<Questionnaire[]>(questionnairesJson),
  /** The waiver text dog parents sign now (server-owned and versioned in the real API). */
  waiverCurrent: clone<CurrentWaiver>(waiversJson.current),
  waivers: clone<StoredWaiver[]>(waiversJson.signed),
};

export const resetDb = () => {
  db.users = clone(usersJson);
  db.dogs = clone(dogsJson);
  db.bookings = clone(bookingsJson);
  db.settings = clone(settingsJson);
  db.questionnaires = clone(questionnairesJson);
  db.waiverCurrent = clone(waiversJson.current);
  db.waivers = clone(waiversJson.signed);
};

let seq = 1000;
export const newId = (prefix: string) => `${prefix}_${++seq}`;

export const publicUser = ({ password: _pw, ...user }: MockUser): User => user;
