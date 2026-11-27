// Pure helpers for the public waiver form: state, validation (same rules as the server), progress, payload.
import type { CurrentWaiver, SignatureData, WaiverSubmission } from '@/api/types';
import type { WaiverLayout } from './waiverLayout';
import { waiverText } from './waiverText';

export interface WaiverForm {
  parentName: string;
  dogName: string;
  phone: string;
  typedSignature: string;
  consents: Record<string, boolean>;
  signature: SignatureData | null;
}
export type WaiverErrors = Record<string, string>;
export type WaiverTextField = 'parentName' | 'dogName' | 'phone' | 'typedSignature';

export const emptyWaiverForm = (): WaiverForm => ({ parentName: '', dogName: '', phone: '', typedSignature: '', consents: {}, signature: null });

// Same rule as the server (and the Know Your Dog form): 7-20 characters of digits, +, - and spaces.
const PHONE = /^[0-9+\-\s]{7,20}$/;
const squash = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Typed signature must be the parent's name (case and extra spaces ignored). */
export const namesMatch = (typed: string, name: string) => !!squash(name) && squash(typed) === squash(name);

// Server rules for the drawn signature (the pad clamps points to the box and stops at the maxima).
export const SIGNATURE_MIN_POINTS = 10;
export const SIGNATURE_MIN_SPAN = 20; // px across (width or height of the drawn area)

/** A real signature: at least 10 points spanning 20px or more (a tap or a dot is not enough). */
export function hasSignature(s: SignatureData | null): boolean {
  if (!s) return false;
  const points = s.strokes.flat();
  if (points.length < SIGNATURE_MIN_POINTS) return false;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) >= SIGNATURE_MIN_SPAN;
}

/** Every validated key in page order: consents in the text, then the signature card top to bottom. */
export const fieldOrder = (layout: WaiverLayout) => [
  ...layout.order,
  'parentName',
  'dogName',
  'phone',
  ...layout.signCard,
  'signature',
  'typedSignature',
];

/** Errors keyed by field / consent key, in page order (the first key is the first error on the page). */
export function validateWaiver(form: WaiverForm, waiver: CurrentWaiver, order: string[]): WaiverErrors {
  const required = new Map(waiver.consents.filter((c) => c.required).map((c) => [c.key, c]));
  const errors: WaiverErrors = {};
  for (const key of order) {
    const consent = required.get(key);
    if (consent) {
      if (form.consents[key] !== true) errors[key] = consent.shortLabel ? waiverText.tickThis(consent.shortLabel) : waiverText.tickRequired;
      continue;
    }
    switch (key) {
      case 'parentName':
        if (!form.parentName.trim()) errors[key] = waiverText.parentNameRequired;
        break;
      case 'dogName':
        if (!form.dogName.trim()) errors[key] = waiverText.dogNameRequired;
        break;
      case 'phone':
        if (!form.phone.trim()) errors[key] = waiverText.phoneRequired;
        else if (!PHONE.test(form.phone.trim())) errors[key] = waiverText.phoneInvalid;
        break;
      case 'signature':
        if (!hasSignature(form.signature)) errors[key] = waiverText.signatureRequired;
        break;
      case 'typedSignature':
        if (!form.typedSignature.trim()) errors[key] = waiverText.typedRequired;
        else if (!namesMatch(form.typedSignature, form.parentName)) errors[key] = waiverText.typedMismatch;
        break;
    }
  }
  return errors;
}

/** Share of required items done, 0-1 (header progress bar). */
export function waiverProgress(form: WaiverForm, waiver: CurrentWaiver, order: string[]): number {
  const required = new Set(waiver.consents.filter((c) => c.required).map((c) => c.key));
  const keys = order.filter((k) => required.has(k) || !waiver.consents.some((c) => c.key === k));
  if (!keys.length) return 0;
  const done = keys.filter((k) => {
    if (required.has(k)) return form.consents[k] === true;
    if (k === 'signature') return hasSignature(form.signature);
    if (k === 'typedSignature') return namesMatch(form.typedSignature, form.parentName);
    return !!String(form[k as WaiverTextField] ?? '').trim();
  }).length;
  return done / keys.length;
}

/** True once the parent has typed, ticked or drawn anything (closing the tab then asks first). */
export const isTouched = (form: WaiverForm) =>
  !!(form.parentName || form.dogName || form.phone || form.typedSignature || form.signature) || Object.values(form.consents).some(Boolean);

/** Body for POST /waivers: every consent key as a boolean, trimmed text, the version the page showed. */
export function buildSubmission(
  waiver: CurrentWaiver,
  form: WaiverForm,
  extra: { questionnaireId?: string; website: string },
): WaiverSubmission {
  return {
    version: waiver.version,
    contentHash: waiver.contentHash,
    parentName: form.parentName.trim(),
    dogName: form.dogName.trim(),
    phone: form.phone.trim(),
    consents: Object.fromEntries(waiver.consents.map((c) => [c.key, form.consents[c.key] === true])),
    typedSignature: form.typedSignature.trim().replace(/\s+/g, ' '),
    signature: form.signature!,
    ...(extra.questionnaireId ? { questionnaireId: extra.questionnaireId } : {}),
    website: extra.website,
  };
}
