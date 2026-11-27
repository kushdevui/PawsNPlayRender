// Date helpers. Forms keep dates as 'YYYY-MM-DD' and times as 'HH:mm' (device local time);
// the API receives full ISO strings built with combineDateTime().

const pad = (n: number) => String(n).padStart(2, '0');
export const DAY_MS = 24 * 60 * 60 * 1000;

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeKey = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 'YYYY-MM-DD' -> local Date at midnight. */
export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Local date + time -> ISO string for the API. */
export const combineDateTime = (dateKey: string, timeKey: string) => {
  const [h, min] = timeKey.split(':').map(Number);
  const d = fromDateKey(dateKey);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);
export const isToday = (d: Date) => isSameDay(d, new Date());

/** Monday 00:00 of the week containing d. */
export const startOfWeek = (d: Date) => {
  const day = (d.getDay() + 6) % 7; // Mon = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
};

/** [from, to) range for API filters. */
export const weekRange = (offsetWeeks = 0, base = new Date()) => {
  const start = addDays(startOfWeek(base), offsetWeeks * 7);
  return { from: start.toISOString(), to: addDays(start, 7).toISOString() };
};
/** Inclusive local date keys -> [from, to) ISO range. */
export const dateKeysRange = (fromKey: string, toKey: string) => ({
  from: fromDateKey(fromKey).toISOString(),
  to: addDays(fromDateKey(toKey), 1).toISOString(),
});
export const monthRange = (month: Date) => ({ from: startOfMonth(month).toISOString(), to: addMonths(month, 1).toISOString() });
export const dayRange = (day: Date) => ({ from: startOfDay(day).toISOString(), to: addDays(day, 1).toISOString() });

/** Calendar nights between two ISO datetimes (min 1) - same rule as the API. */
export const nightsBetween = (checkInIso: string, checkOutIso: string) =>
  Math.max(1, Math.round((startOfDay(new Date(checkOutIso)).getTime() - startOfDay(new Date(checkInIso)).getTime()) / DAY_MS));

// ---------- display ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** Calendar column headers (Sunday first). Two letters so Sun/Sat are distinguishable. */
export const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Split month cells (leading nulls + days) into weeks of exactly 7, padding the last week.
 * Render each week as its own row of flex:1 cells - percentage widths + flexWrap can
 * round past 100% on devices and push Saturday onto the next line.
 */
export const toWeeks = <T>(cells: Array<T | null>): Array<Array<T | null>> => {
  const padded = [...cells, ...Array.from({ length: (7 - (cells.length % 7)) % 7 }, () => null)];
  return Array.from({ length: padded.length / 7 }, (_, w) => padded.slice(w * 7, w * 7 + 7));
};

/** "Mon, 25 Nov" */
export const formatDate = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${WEEKDAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`;
};
/** "25 Nov 2026" */
export const formatDateLong = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};
/** "November 2026" */
export const formatMonth = (d: Date) => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;

/** "10:00 AM" from a Date or 'HH:mm' */
export const formatTime = (v: Date | string) => {
  const [h, m] = typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v.split(':').map(Number) : [new Date(v).getHours(), new Date(v).getMinutes()];
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`;
};

/** "23 Nov – 29 Nov" for a [from, to) ISO range (adds years when they differ from now). */
export const formatRange = (fromIso: string, toIso: string) => {
  const a = new Date(fromIso);
  const b = addDays(new Date(toIso), -1); // to is exclusive
  const y = (d: Date) => (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '');
  const f = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}${y(d)}`;
  return isSameDay(a, b) ? f(a) : `${f(a)} – ${f(b)}`;
};

/** "Mon, 25 Nov · 10:00 AM" */
export const formatDateTime = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)}`;

/** "25 Nov → 28 Nov" (adds year only when it differs from now) */
export const formatStayRange = (checkIn: string, checkOut: string) => {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const y = (d: Date) => (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '');
  return `${a.getDate()} ${MONTHS[a.getMonth()]}${y(a)} → ${b.getDate()} ${MONTHS[b.getMonth()]}${y(b)}`;
};

/** Every 30 minutes, 06:00 - 22:00 */
export const TIME_SLOTS = Array.from({ length: 33 }, (_, i) => {
  const mins = 6 * 60 + i * 30;
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
});
