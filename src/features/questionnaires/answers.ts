// Turn a flat `answers` object into the same 8 sections and labels as the public form.
// Labels and sections come from knowYourDog/kydData so the admin view never drifts from the form.
import type { Dog, QuestionnaireAnswers } from '@/api/types';
import { RATE_OPTIONS, RATE_ROWS, kydSections, type FieldDef } from '@/features/knowYourDog/kydData';
import { rateKey, rateNoteKey } from '@/features/knowYourDog/kydLogic';
import { formatDateLong, fromDateKey } from '@/utils/date';

export type AnswerTone = 'success' | 'accent' | 'danger';

export interface AnswerRow {
  key: string;
  label: string;
  value: string;
  /** Safety-relevant answer: shown with a warning tint. */
  warn?: boolean;
  /** Fine / Unsure / Not okay rows: colour of the rating. */
  tone?: AnswerTone;
  /** Story behind a Fine / Unsure / Not okay rating. */
  note?: string;
  /** Phone answer: tappable (tel: / WhatsApp). */
  phone?: boolean;
}

export interface AnswerSection {
  n: number;
  title: string;
  rows: AnswerRow[];
}

/** Free-text answers that matter for safety when they say anything beyond "no". */
const SAFETY_KEYS = new Set(['biteHistory', 'fightHistory', 'escapeRisk', 'medication', 'allergies', 'recentIllness', 'skinIssues']);
/** "No", "None", "Nil", "N/A" ... mean nothing to flag. */
const NEGATIVE = /^(no|none|nil|na|n\/a|nope|never|nothing|not really|no issues?)\.?$/i;
export const isMeaningful = (v: string) => !!v.trim() && !NEGATIVE.test(v.trim());

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const asText = (v: string | boolean | undefined) => (typeof v === 'string' ? v.trim() : '');

const fieldRows = (f: FieldDef, answers: QuestionnaireAnswers): AnswerRow[] => {
  switch (f.kind) {
    case 'text': {
      const v = asText(answers[f.key]);
      if (!v) return [];
      return [{ key: f.key, label: f.label, value: v, warn: SAFETY_KEYS.has(f.key) && isMeaningful(v), phone: f.phone }];
    }
    case 'choice': {
      const v = asText(answers[f.key]);
      if (!v) return [];
      return [{ key: f.key, label: f.label, value: f.options.find((o) => o.value === v)?.label ?? v }];
    }
    case 'date': {
      const v = asText(answers[f.key]);
      if (!v) return [];
      return [{ key: f.key, label: f.label, value: DATE_KEY.test(v) ? formatDateLong(fromDateKey(v)) : v }];
    }
    case 'confirm': {
      if (answers.confirmTrue === undefined) return [];
      return [{ key: f.key, label: f.label, value: answers.confirmTrue === true ? 'Yes, confirmed' : 'Not confirmed', warn: answers.confirmTrue !== true }];
    }
    case 'rates':
      return RATE_ROWS.flatMap((r): AnswerRow[] => {
        const rating = asText(answers[rateKey(r.key)]);
        const note = asText(answers[rateNoteKey(r.key)]);
        if (!rating && !note) return [];
        const option = RATE_OPTIONS.find((o) => o.value === rating);
        return [{
          key: rateKey(r.key),
          label: r.label,
          value: option?.label ?? (rating || 'Not rated'),
          tone: option?.tone,
          note: note || undefined,
          warn: rating === 'not_okay',
        }];
      });
    case 'documents':
      return []; // files are listed separately
  }
};

/** Every answer key the form knows (rates expand to rating + note). */
const KNOWN_KEYS = new Set(
  kydSections.flatMap((s) =>
    s.fields.flatMap((f) => (f.kind === 'rates' ? RATE_ROWS.flatMap((r) => [rateKey(r.key), rateNoteKey(r.key)]) : [f.key])),
  ),
);

/** Answered questions only, grouped like the form; keys the form doesn't know go to `extra`. */
export function groupAnswers(answers: QuestionnaireAnswers): { sections: AnswerSection[]; extra: AnswerRow[]; warnings: number } {
  const sections = kydSections
    .map((s) => ({ n: s.n, title: s.title, rows: s.fields.flatMap((f) => fieldRows(f, answers)) }))
    .filter((s) => s.rows.length > 0);
  const extra: AnswerRow[] = Object.entries(answers)
    .filter(([k, v]) => !KNOWN_KEYS.has(k) && v !== '' && v !== undefined)
    .map(([k, v]) => ({ key: k, label: k, value: typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v }));
  const warnings = sections.reduce((n, s) => n + s.rows.filter((r) => r.warn).length, 0);
  return { sections, extra, warnings };
}

/** Dog profile fields prefilled from a submission (Add dog from this form). Admin reviews before saving. */
export function dogFromAnswers(answers: QuestionnaireAnswers): Partial<Dog> {
  const a = (k: string) => asText(answers[k]);
  const weight = parseFloat(a('weight').replace(',', '.'));
  const lines = (...parts: Array<[string, string]>) =>
    parts.filter(([, v]) => v).map(([label, v]) => (label ? `${label}: ${v}` : v)).join('\n');
  return {
    name: a('dogName'),
    breed: a('breed'),
    gender: a('sex') === 'female' ? 'female' : 'male',
    neutered: a('sterilised') === 'yes',
    weightKg: Number.isFinite(weight) && weight > 0 ? weight : null,
    ownerName: a('ownerName'),
    ownerPhone: a('ownerPhone'),
    vaccinated: !!(a('rabiesDate') || a('comboVaccineDate')),
    feedingNotes: lines(
      ['', a('homeDiet')],
      ['Special food', a('specialFood')],
      ['Avoid', a('avoidFoods')],
      ['Extra meal', a('extraMeal') === 'yes' ? 'Yes' : ''],
    ),
    medicalNotes: lines(
      ['', a('conditions')],
      ['Medication', a('medication')],
      ['Allergies', isMeaningful(a('allergies')) ? a('allergies') : ''],
    ),
    notes: lines(['Emergency contact', [a('emergencyName'), a('emergencyPhone')].filter(Boolean).join(', ')]),
  };
}
