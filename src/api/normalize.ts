// Make API responses safe to render even when the server's shape differs from the contract
// (docs/BACKEND_API_SPEC.md). Missing fields get safe defaults instead of crashing screens,
// and in development we warn once per field so the backend can be aligned.
import type {
  AuthResponse, BillingSummary, Booking, CurrentWaiver, DashboardStats, Dog, FacilitySettings, OccupancyCalendar, PaymentStatus,
  Questionnaire, QuestionnaireAnswers, QuestionnaireListItem, QuestionnaireStatus, SignatureData, User, Waiver, WaiverBlock,
  WaiverContent, WaiverListItem, WaiverPart, WaiverReceipt,
} from './types';

const warned = new Set<string>();
const warnMissing = (where: string, obj: unknown, fields: string[]) => {
  if (!__DEV__ || !obj || typeof obj !== 'object') return;
  for (const f of fields) {
    const key = `${where}.${f}`;
    if ((obj as Record<string, unknown>)[f] === undefined && !warned.has(key)) {
      warned.add(key);
      console.warn(`[api] ${where} is missing "${f}" - using a default. See docs/BACKEND_API_SPEC.md.`);
    }
  }
};

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : v == null ? fallback : String(v));
/** Accepts `id` or Mongo-style `_id`. */
const idOf = (o: any) => str(o?.id ?? o?._id);

export function normalizeBooking(raw: any): Booking {
  warnMissing('Booking', raw, ['id', 'dogId', 'checkIn', 'checkOut', 'status', 'nights', 'totalAmount', 'payments', 'amountPaid', 'balanceDue', 'paymentStatus', 'dog']);
  const payments = arr<any>(raw?.payments).map((p) => ({
    id: idOf(p),
    amount: num(p?.amount),
    type: p?.type ?? 'payment',
    method: p?.method ?? 'cash',
    note: str(p?.note),
    receivedAt: str(p?.receivedAt ?? p?.createdAt),
    recordedBy: str(p?.recordedBy),
  }));
  const status = raw?.status ?? 'confirmed';
  const totalAmount = num(raw?.totalAmount);
  const amountPaid = raw?.amountPaid !== undefined ? num(raw.amountPaid) : payments.reduce((s, p) => s + (p.type === 'refund' ? -p.amount : p.amount), 0);
  const owed = status === 'cancelled' ? 0 : totalAmount;
  const balanceDue = raw?.balanceDue !== undefined ? num(raw.balanceDue) : owed - amountPaid;
  const paymentStatus: PaymentStatus =
    raw?.paymentStatus ?? (balanceDue < 0 ? 'overpaid' : owed === 0 || balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid');
  // dogId may come populated as an object.
  const dogObj = raw?.dog ?? (raw?.dogId && typeof raw.dogId === 'object' ? raw.dogId : null);
  const dogId = typeof raw?.dogId === 'object' && raw?.dogId ? idOf(raw.dogId) : str(raw?.dogId ?? dogObj?.id ?? dogObj?._id);
  return {
    id: idOf(raw),
    dogId,
    dog: dogObj
      ? { id: idOf(dogObj) || dogId, name: str(dogObj.name, 'Dog'), breed: str(dogObj.breed), ownerName: str(dogObj.ownerName), ownerPhone: str(dogObj.ownerPhone) }
      : null,
    checkIn: str(raw?.checkIn),
    checkOut: str(raw?.checkOut),
    status,
    kennel: raw?.kennel ?? null,
    nights: num(raw?.nights, 1),
    pricePerNight: num(raw?.pricePerNight),
    totalAmount,
    currency: str(raw?.currency, 'INR'),
    notes: str(raw?.notes),
    source: raw?.source ?? 'admin',
    createdBy: str(raw?.createdBy),
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
    payments,
    amountPaid,
    balanceDue,
    paymentStatus,
  };
}

export function normalizeDog(raw: any): Dog {
  warnMissing('Dog', raw, ['id', 'name', 'ownerName', 'ownerPhone', 'status']);
  return {
    id: idOf(raw),
    name: str(raw?.name, 'Dog'),
    breed: str(raw?.breed),
    gender: raw?.gender === 'female' ? 'female' : 'male',
    dateOfBirth: raw?.dateOfBirth ?? null,
    weightKg: raw?.weightKg ?? null,
    color: str(raw?.color),
    ownerId: raw?.ownerId ?? null,
    ownerName: str(raw?.ownerName),
    ownerPhone: str(raw?.ownerPhone),
    vaccinated: !!raw?.vaccinated,
    vaccinationExpiry: raw?.vaccinationExpiry ?? null,
    neutered: !!raw?.neutered,
    temperament: raw?.temperament ?? 'friendly',
    feedingNotes: str(raw?.feedingNotes),
    medicalNotes: str(raw?.medicalNotes),
    notes: str(raw?.notes),
    photoUrl: raw?.photoUrl ?? null,
    documents: arr<any>(raw?.documents).map((d) => ({ ...d, id: idOf(d) })),
    status: raw?.status === 'archived' ? 'archived' : 'active',
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
  };
}

export function normalizeDashboard(raw: any): DashboardStats {
  warnMissing('DashboardStats', raw, [
    'capacity', 'occupiedNow', 'availableNow', 'todayCheckIns', 'todayCheckOuts', 'upcoming',
    'occupancyNext7Days', 'activeDogs', 'bookingsThisMonth', 'paymentsDue', 'paymentsDueBookings',
  ]);
  const capacity = num(raw?.capacity);
  const occupiedNow = num(raw?.occupiedNow);
  return {
    capacity,
    occupiedNow,
    availableNow: raw?.availableNow !== undefined ? num(raw.availableNow) : Math.max(0, capacity - occupiedNow),
    todayCheckIns: arr(raw?.todayCheckIns).map(normalizeBooking),
    todayCheckOuts: arr(raw?.todayCheckOuts).map(normalizeBooking),
    upcoming: arr(raw?.upcoming).map(normalizeBooking),
    occupancyNext7Days: arr<any>(raw?.occupancyNext7Days).map((d) => ({ date: str(d?.date), count: num(d?.count) })),
    activeDogs: num(raw?.activeDogs),
    bookingsThisMonth: num(raw?.bookingsThisMonth),
    paymentsDue: num(raw?.paymentsDue),
    paymentsDueBookings: num(raw?.paymentsDueBookings),
  };
}

export function normalizeOccupancy(raw: any): OccupancyCalendar {
  warnMissing('OccupancyCalendar', raw, ['capacity', 'days']);
  const capacity = num(raw?.capacity);
  return {
    capacity,
    days: arr<any>(raw?.days).map((d) => {
      const occupied = num(d?.occupied);
      return {
        date: str(d?.date),
        occupied,
        available: d?.available !== undefined ? num(d.available) : Math.max(0, capacity - occupied),
        checkIns: num(d?.checkIns),
        checkOuts: num(d?.checkOuts),
      };
    }),
  };
}

export function normalizeBilling(raw: any): BillingSummary {
  warnMissing('BillingSummary', raw, ['expected', 'received', 'due', 'outstandingAllTime', 'collected']);
  return {
    from: str(raw?.from),
    to: str(raw?.to),
    currency: str(raw?.currency, 'INR'),
    bookings: num(raw?.bookings),
    expected: num(raw?.expected),
    received: num(raw?.received),
    due: num(raw?.due),
    advances: num(raw?.advances),
    paidCount: num(raw?.paidCount),
    partialCount: num(raw?.partialCount),
    unpaidCount: num(raw?.unpaidCount),
    outstandingAllTime: num(raw?.outstandingAllTime),
    outstandingBookings: num(raw?.outstandingBookings),
    collected: num(raw?.collected),
    collectedCount: num(raw?.collectedCount),
  };
}

export function normalizeSettings(raw: any): FacilitySettings {
  warnMissing('FacilitySettings', raw, ['capacity', 'pricePerNight', 'defaultCheckInTime', 'defaultCheckOutTime']);
  return {
    facilityName: str(raw?.facilityName, "Paws N' Play Boarding"),
    capacity: num(raw?.capacity, 1),
    defaultCheckInTime: str(raw?.defaultCheckInTime, '10:00'),
    defaultCheckOutTime: str(raw?.defaultCheckOutTime, '18:00'),
    pricePerNight: num(raw?.pricePerNight),
    currency: str(raw?.currency, 'INR'),
    timezone: str(raw?.timezone, 'Asia/Kolkata'),
  };
}

export function normalizeUser(raw: any): User {
  warnMissing('User', raw, ['id', 'name', 'email', 'role']);
  return {
    id: idOf(raw),
    name: str(raw?.name, str(raw?.email, 'User')),
    email: str(raw?.email),
    role: raw?.role === 'admin' || raw?.role === 'staff' ? raw.role : 'user',
    phone: raw?.phone ?? null,
    avatarUrl: raw?.avatarUrl ?? null,
    status: raw?.status === 'inactive' ? 'inactive' : 'active',
    createdAt: str(raw?.createdAt),
  };
}

const questionnaireStatus = (v: unknown): QuestionnaireStatus => (v === 'reviewed' || v === 'archived' ? v : 'new');

export function normalizeQuestionnaireListItem(raw: any): QuestionnaireListItem {
  warnMissing('QuestionnaireListItem', raw, ['id', 'status', 'createdAt', 'dogName', 'ownerName', 'ownerPhone']);
  return {
    id: idOf(raw),
    status: questionnaireStatus(raw?.status),
    createdAt: str(raw?.createdAt),
    dogName: str(raw?.dogName, 'Dog'),
    breed: str(raw?.breed),
    ownerName: str(raw?.ownerName),
    ownerPhone: str(raw?.ownerPhone),
    documentsCount: num(raw?.documentsCount),
  };
}

export function normalizeQuestionnaire(raw: any): Questionnaire {
  warnMissing('Questionnaire', raw, ['id', 'status', 'answers', 'documents', 'createdAt']);
  // Keep only flat string / boolean answers - anything else can't be rendered safely.
  const answers: QuestionnaireAnswers = {};
  if (raw?.answers && typeof raw.answers === 'object') {
    for (const [k, v] of Object.entries(raw.answers as Record<string, unknown>)) {
      if (typeof v === 'string' || typeof v === 'boolean') answers[k] = v;
      else if (typeof v === 'number') answers[k] = String(v);
    }
  }
  return {
    id: idOf(raw),
    status: questionnaireStatus(raw?.status),
    answers,
    documents: arr<any>(raw?.documents).map((d) => ({
      id: idOf(d),
      name: str(d?.name, 'File'),
      uri: str(d?.uri ?? d?.url),
      mimeType: str(d?.mimeType, 'application/octet-stream'),
      size: d?.size == null ? null : num(d.size),
      uploadedAt: str(d?.uploadedAt),
    })),
    dogId: raw?.dogId ? (typeof raw.dogId === 'object' ? idOf(raw.dogId) : str(raw.dogId)) : null,
    reviewedBy: raw?.reviewedBy ? (typeof raw.reviewedBy === 'object' ? idOf(raw.reviewedBy) : str(raw.reviewedBy)) : null,
    reviewedByName: raw?.reviewedByName ? str(raw.reviewedByName) : null,
    reviewedAt: raw?.reviewedAt ?? null,
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
  };
}

// ---------- Waivers ----------
const strs = (v: unknown) => arr<unknown>(v).map((x) => str(x)).filter(Boolean);
const refId = (v: any): string | null => (v ? (typeof v === 'object' ? idOf(v) || null : str(v)) : null);

/** One content block; unknown types (or blocks without text) are dropped so the page never crashes. */
function normalizeWaiverBlock(raw: any): WaiverBlock | null {
  const opt = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
  switch (raw?.type) {
    case 'paragraph':
    case 'statement':
      return raw.text ? { type: raw.type, text: str(raw.text) } : null;
    case 'card':
      return raw.text || raw.title
        ? {
            type: 'card',
            title: opt(raw.title),
            text: str(raw.text),
            note: opt(raw.note),
            extra: opt(raw.extra),
            ...(Array.isArray(raw.items) ? { items: strs(raw.items) } : {}),
          }
        : null;
    case 'bullets':
      return { type: 'bullets', title: opt(raw.title), items: strs(raw.items) };
    case 'numbered':
      return { type: 'numbered', intro: str(raw.intro), items: strs(raw.items) };
    case 'rates':
      return {
        type: 'rates',
        title: str(raw.title),
        text: str(raw.text),
        items: arr<any>(raw.items).map((i) => ({ price: str(i?.price), label: str(i?.label) })),
      };
    default:
      return null;
  }
}

const normalizeWaiverPart = (raw: any, i: number): WaiverPart => ({
  id: str(raw?.id, `part${i + 1}`),
  label: raw?.label === 'Part A' || raw?.label === 'Part B' ? raw.label : null,
  title: str(raw?.title),
  blocks: arr<any>(raw?.blocks).map(normalizeWaiverBlock).filter((b): b is WaiverBlock => b !== null),
});

const normalizeWaiverContent = (c: any, version: unknown): WaiverContent => ({
  version: str(c?.version ?? version),
  title: str(c?.title, 'Boarding Consent & Waiver'),
  intro: strs(c?.intro),
  parts: arr<any>(c?.parts).map(normalizeWaiverPart),
});

export function normalizeCurrentWaiver(raw: any): CurrentWaiver {
  warnMissing('CurrentWaiver', raw, ['version', 'contentHash', 'content', 'consents']);
  return {
    version: str(raw?.version ?? raw?.content?.version),
    contentHash: str(raw?.contentHash),
    content: normalizeWaiverContent(raw?.content, raw?.version),
    consents: arr<any>(raw?.consents)
      .filter((x) => x?.key)
      .map((x) => ({
        key: str(x.key),
        label: str(x.label),
        shortLabel: str(x.shortLabel, str(x.label).split('\n')[0]),
        required: x.required !== false,
      })),
  };
}

export const normalizeWaiverReceipt = (raw: any): WaiverReceipt => ({
  id: idOf(raw),
  signedAt: str(raw?.signedAt ?? raw?.createdAt),
  version: str(raw?.version),
});

const normalizeSignature = (raw: any): SignatureData | null => {
  if (!raw || typeof raw !== 'object') return null;
  const strokes = arr<unknown>(raw.strokes)
    .map((s) => arr<unknown>(s).filter((p): p is number[] => Array.isArray(p) && p.length >= 2).map((p) => [num(p[0]), num(p[1])]))
    .filter((s) => s.length > 0);
  const width = num(raw.width);
  const height = num(raw.height);
  return width > 0 && height > 0 && strokes.length ? { width, height, strokes } : null;
};

export function normalizeWaiverListItem(raw: any): WaiverListItem {
  warnMissing('WaiverListItem', raw, ['id', 'signedAt', 'parentName', 'dogName', 'phone']);
  return {
    id: idOf(raw),
    signedAt: str(raw?.signedAt ?? raw?.createdAt),
    parentName: str(raw?.parentName),
    dogName: str(raw?.dogName, 'Dog'),
    phone: str(raw?.phone),
    version: str(raw?.version),
    photosOptOut: raw?.photosOptOut === true,
    questionnaireId: refId(raw?.questionnaireId),
    dogId: refId(raw?.dogId),
  };
}

export function normalizeWaiver(raw: any): Waiver {
  warnMissing('Waiver', raw, ['id', 'signedAt', 'parentName', 'dogName', 'consents', 'signature']);
  return {
    ...normalizeWaiverListItem(raw),
    contentHash: str(raw?.contentHash),
    consents: arr<any>(raw?.consents)
      .filter((x) => x?.key)
      .map((x) => ({ key: str(x.key), label: str(x.label, str(x.key)), value: x.value === true })),
    typedSignature: str(raw?.typedSignature),
    signature: normalizeSignature(raw?.signature),
    signatureSvg: str(raw?.signatureSvg),
    userAgent: str(raw?.userAgent),
    status: 'signed',
    content: raw?.content && typeof raw.content === 'object' ? normalizeWaiverContent(raw.content, raw?.version) : null,
    createdAt: str(raw?.createdAt ?? raw?.signedAt),
    updatedAt: str(raw?.updatedAt ?? raw?.createdAt),
  };
}

/** Accepts accessToken/token and refreshToken naming variants. */
export function normalizeAuth(raw: any): AuthResponse {
  warnMissing('AuthResponse', raw, ['accessToken', 'refreshToken', 'user']);
  return {
    accessToken: str(raw?.accessToken ?? raw?.token ?? raw?.access_token),
    refreshToken: str(raw?.refreshToken ?? raw?.refresh_token),
    user: normalizeUser(raw?.user ?? {}),
  };
}
