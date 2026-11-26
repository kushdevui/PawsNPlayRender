import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionnairesApi } from '@/api/endpoints';
import type { QuestionnaireFilters, QuestionnaireUpdate } from '@/api/types';
import { queryKeys } from '../queryKeys';

/** "Know Your Dog" submissions, newest first. */
export const useQuestionnaires = (filters?: QuestionnaireFilters, options?: { enabled?: boolean; limit?: number }) =>
  useQuery({
    queryKey: queryKeys.questionnaires({ ...filters, limit: options?.limit }),
    queryFn: () => questionnairesApi.list({ limit: options?.limit ?? 500, ...filters }),
    enabled: options?.enabled ?? true,
  });

/** Number of submissions nobody has reviewed yet (dashboard card). */
export const useNewQuestionnairesCount = () => {
  const q = useQuestionnaires({ status: 'new' }, { limit: 1 });
  return { count: q.data?.meta.total, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
};

export const useQuestionnaire = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.questionnaire(id ?? ''), queryFn: () => questionnairesApi.get(id!), enabled: !!id });

/** PATCH status / linked dog. Refreshes every list (and counts) plus the detail. */
export const useUpdateQuestionnaire = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestionnaireUpdate) => questionnairesApi.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.questionnaire(id), data);
      qc.invalidateQueries({ queryKey: ['questionnaires', 'list'] });
      qc.invalidateQueries({ queryKey: queryKeys.questionnaire(id) });
    },
  });
};
