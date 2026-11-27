// Turn a flat `answers` object into the same sections and labels as the public form.
// Labels and sections come from knowYourDog/kydData so the admin view never drifts from the form.
// Every question is listed (unanswered ones say "Not answered") so the team sees the whole form.
import type { QuestionnaireAnswers } from '@/api/types';
import { kydSections, type FieldDef } from '@/features/knowYourDog/kydData';
import { isFieldVisible } from '@/features/knowYourDog/kydLogic';
import { formatDateLong, fromDateKey } from '@/utils/date';

export type AnswerTone = 'success' | 'accent' | 'danger';

export interface AnswerRow {
  key: string;
  label: string;
  /** Empty string = not answered. */
  value: string;
  /** Safety-relevant answer: shown with a warning tint. */
  warn?: boolean;
  /** Fine / Unsure / Not okay ratings (earlier form only). */
  tone?: AnswerTone;
  /** Story behind a rating (earlier form only). */
  note?: string;
  /** Phone answer: tappable (tel: / WhatsApp). */
  phone?: boolean;
}

export interface AnswerSection {
  n: number;
  title: string;
  rows: AnswerRow[];
  answered: number;
}

/** Free-text answers that matter for safety when they say anything beyond "no". */
const SAFETY_KEYS = new Set([
  'biteHistory',
  'fightHistory',
  'escapeRisk',
  'medication',
  'allergies',
  'recentIllness',
  'skinIssues',
  'otherDogs',
  'withPeople',
]);
/** Yes/no answers the team must act on before the stay when the answer is "yes". */
const ACT_ON_YES = new Set(['keepSeparate', 'extraMeal', 'ownBowls', 'bath']);
/** "No", "None", "Nil", "N/A" ... mean nothing to flag. */
const NEGATIVE = /^(no|none|nil|na|n\/a|nope|never|nothing|not really|no issues?|fine|good|friendly)\.?$/i;
export const isMeaningful = (v: string) => !!v.trim() && !NEGATIVE.test(v.trim());

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const asText = (v: string | boolean | undefined) => (typeof v === 'string' ? v.trim() : '');

const fieldRow = (f: FieldDef, answers: QuestionnaireAnswers): AnswerRow | null => {
  switch (f.kind) {
    case 'text': {
      const v = asText(answers[f.key]);
      return { key: f.key, label: f.label, value: v, warn: SAFETY_KEYS.has(f.key) && isMeaningful(v), phone: !!v && f.phone };
    }
    case 'choice': {
      const v = asText(answers[f.key]);
      return { key: f.key, label: f.label, value: f.options.find((o) => o.value === v)?.label ?? v, warn: ACT_ON_YES.has(f.key) && v === 'yes' };
    }
    case 'date': {
      const v = asText(answers[f.key]);
      return { key: f.key, label: f.label, value: DATE_KEY.test(v) ? formatDateLong(fromDateKey(v)) : v };
    }
    case 'confirm':
      return {
        key: f.key,
        label: f.label,
        value: answers.confirmTrue === true ? 'Yes, confirmed' : 'Not confirmed',
        warn: answers.confirmTrue !== true,
      };
    case 'documents':
      return null; // files are listed separately
  }
};

/** Every answer key the current form knows. */
const KNOWN_KEYS = new Set(kydSections.flatMap((s) => s.fields.map((f) => f.key)));

// ---- Answers from the earlier form (before Nov 2026), shown readably under "Earlier form answers" ----
const LEGACY_RATE_LABELS: Record<string, string> = {
  biggerDogs: 'Dogs bigger than them',
  smallerDogs: 'Dogs smaller than them',
  maleDogs: 'Male dogs',
  femaleDogs: 'Female dogs',
  puppies: 'Puppies or very playful dogs',
  newPeople: 'New people',
  men: 'Men',
  women: 'Women',
};
const LEGACY_RATES: Record<string, { label: string; tone: AnswerTone }> = {
  fine: { label: 'Fine', tone: 'success' },
  unsure: { label: 'Unsure', tone: 'accent' },
  not_okay: { label: 'Not okay', tone: 'danger' },
};
const LEGACY_LABELS: Record<string, string> = {
  breedsDislike: "Any particular breed or type of dog they don't get along with?",
};
/** "camelCase_key" -> "Camel case key" for keys nobody has labelled. */
const humanize = (key: string) => {
  const words = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function legacyRows(answers: QuestionnaireAnswers): AnswerRow[] {
  const rows: AnswerRow[] = [];
  const used = new Set<string>();
  for (const [row, label] of Object.entries(LEGACY_RATE_LABELS)) {
    const rating = asText(answers[`with_${row}`]);
    const note = asText(answers[`with_${row}_note`]);
    used.add(`with_${row}`).add(`with_${row}_note`);
    if (!rating && !note) continue;
    const r = LEGACY_RATES[rating];
    rows.push({ key: `with_${row}`, label, value: r?.label ?? (rating || 'Not rated'), tone: r?.tone, note: note || undefined, warn: rating === 'not_okay' });
  }
  for (const [k, v] of Object.entries(answers)) {
    if (KNOWN_KEYS.has(k) || used.has(k) || v === '' || v === undefined) continue;
    rows.push({ key: k, label: LEGACY_LABELS[k] ?? humanize(k), value: typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v });
  }
  return rows;
}

/** All questions grouped like the form; answers to questions no longer on the form go to `extra`. */
export function groupAnswers(answers: QuestionnaireAnswers): { sections: AnswerSection[]; extra: AnswerRow[]; warnings: number } {
  const sections = kydSections
    .map((s) => {
      const rows = s.fields
        // Hide conditional questions that didn't apply (e.g. heat for males) unless answered anyway.
        .filter((f) => isFieldVisible(f.key, answers) || !!asText(answers[f.key]))
        .map((f) => fieldRow(f, answers))
        .filter((r): r is AnswerRow => r !== null);
      return { n: s.n, title: s.title, rows, answered: rows.filter((r) => !!r.value).length };
    })
    .filter((s) => s.rows.length > 0);
  const extra = legacyRows(answers);
  const warnings = [...sections.flatMap((s) => s.rows), ...extra].filter((r) => r.warn).length;
  return { sections, extra, warnings };
}
