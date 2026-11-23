// In-memory copy of mock/data/*.json. Mutations last until the app reloads.
import usersJson from '../../../mock/data/users.json';
import petsJson from '../../../mock/data/pets.json';
import servicesJson from '../../../mock/data/services.json';
import bookingsJson from '../../../mock/data/bookings.json';
import notificationsJson from '../../../mock/data/notifications.json';
import type { AppNotification, Booking, Pet, Service, User } from '../types';

export type MockUser = User & { password: string };

const clone = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;

export const db = {
  users: clone<MockUser[]>(usersJson),
  pets: clone<Pet[]>(petsJson),
  services: clone<Service[]>(servicesJson),
  bookings: clone<Booking[]>(bookingsJson),
  notifications: clone<AppNotification[]>(notificationsJson),
};

export const resetDb = () => {
  db.users = clone(usersJson);
  db.pets = clone(petsJson);
  db.services = clone(servicesJson);
  db.bookings = clone(bookingsJson);
  db.notifications = clone(notificationsJson);
};

let seq = 1000;
export const newId = (prefix: string) => `${prefix}_${++seq}`;

export const publicUser = ({ password: _pw, ...user }: MockUser): User => user;
