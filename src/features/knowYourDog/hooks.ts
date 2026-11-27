import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { questionnairesApi } from '@/api/endpoints';
import type { QuestionnaireAnswers } from '@/api/types';
import type { LocalFile } from '@/lib/attachments';
import { kydText } from './kydData';

/** POST /questionnaires (public, multipart). */
export const useSubmitQuestionnaire = () =>
  useMutation({
    mutationFn: (v: { answers: QuestionnaireAnswers; files: LocalFile[]; website: string }) =>
      questionnairesApi.submit(v.answers, v.files, v.website),
  });

/** Friendly message for a failed submit: the server's `error.message`, or plain words for network trouble. */
export function submitErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'NETWORK_ERROR') return kydText.networkError;
    if (e.status === 413) return kydText.tooLarge;
    // No envelope (e.g. a proxy 502): the axios text means nothing to a dog parent.
    if (e.code === 'HTTP_ERROR' || e.code === 'CLIENT_ERROR') return kydText.genericError;
    return e.message || kydText.genericError;
  }
  return kydText.genericError;
}

/** Web only: ask before closing the tab while answers are unsent. */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || typeof window === 'undefined') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);
}
