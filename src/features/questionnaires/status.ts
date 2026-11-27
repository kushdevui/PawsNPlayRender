import type { QuestionnaireStatus } from '@/api/types';
import type { BadgeTone } from '@/components/common';

export const questionnaireStatusLabel: Record<QuestionnaireStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  archived: 'Archived',
};

export const questionnaireStatusTone: Record<QuestionnaireStatus, BadgeTone> = {
  new: 'brand',
  reviewed: 'success',
  archived: 'neutral',
};

/** Status chips on the forms list. 'all' = no status filter. */
export type QuestionnaireStatusFilter = QuestionnaireStatus | 'all';
export const QUESTIONNAIRE_STATUS_FILTERS: Array<{ label: string; value: QuestionnaireStatusFilter }> = [
  { label: 'New', value: 'new' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Archived', value: 'archived' },
  { label: 'All', value: 'all' },
];
