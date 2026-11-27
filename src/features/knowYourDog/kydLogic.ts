// Pure helpers for the Know Your Dog form: defaults, visibility, validation, progress, payload.
import type { QuestionnaireAnswers } from '@/api/types';
import { toDateKey } from '@/utils/date';
import { kydSections, kydText, type FieldDef } from './kydData';

/** Form state: text / choice / 'YYYY-MM-DD' strings by answer key, plus confirmTrue (boolean). */
export type KydValues = Record<string, string | boolean>;
export type KydErrors = Record<string, string>;

export const initialValues = (): KydValues => ({ signDate: toDateKey(new Date()), confirmTrue: false });

/** The heat question is only for unsterilised females. */
export const isFieldVisible = (key: string, values: KydValues) =>
  key !== 'heatInfo' || (values.sex === 'female' && values.sterilised === 'no');

// Same rule as the server: 7-20 characters of digits, +, - and spaces.
const PHONE = /^[0-9+\-\s]{7,20}$/;

const str = (v: string | boolean | undefined) => (typeof v === 'string' ? v.trim() : '');

const allFields = (): FieldDef[] => kydSections.flatMap((s) => s.fields);

/** Errors keyed by field key, in page order (the first key is the first error on the page). */
export function validate(values: KydValues): KydErrors {
  const errors: KydErrors = {};
  for (const f of allFields()) {
    if (!isFieldVisible(f.key, values)) continue;
    if (f.kind === 'confirm') {
      if (values.confirmTrue !== true) errors[f.key] = f.required;
    } else if (f.kind === 'text') {
      const v = str(values[f.key]);
      if (!v && f.required) errors[f.key] = f.required;
      else if (v && f.phone && !PHONE.test(v)) errors[f.key] = kydText.invalidPhone;
    } else if ((f.kind === 'choice' || f.kind === 'date') && f.required && !str(values[f.key])) {
      errors[f.key] = f.required;
    }
  }
  return errors;
}

/** Every answer key currently on the page. */
const visibleKeys = (values: KydValues): string[] =>
  allFields().flatMap((f) => {
    if (f.kind === 'documents') return [];
    return isFieldVisible(f.key, values) ? [f.key] : [];
  });

/** Share of visible questions answered, 0-1 (drives the header progress bar). */
export function progressOf(values: KydValues): number {
  const keys = visibleKeys(values);
  const done = keys.filter((k) => (k === 'confirmTrue' ? values.confirmTrue === true : !!str(values[k]))).length;
  return keys.length ? done / keys.length : 0;
}

/** Flat `answers` for POST /questionnaires: trimmed, empty optional answers and hidden questions left out. */
export function buildAnswers(values: KydValues): QuestionnaireAnswers {
  const answers: QuestionnaireAnswers = {};
  for (const key of visibleKeys(values)) {
    if (key === 'confirmTrue') answers.confirmTrue = values.confirmTrue === true;
    else if (str(values[key])) answers[key] = str(values[key]);
  }
  return answers;
}
