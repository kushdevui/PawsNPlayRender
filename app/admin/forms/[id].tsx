// One "Know Your Dog" submission, read-only: owner contact, safety flags, record files and every question
// with its answer. Everything comes from one call (GET /questionnaires/:id); the only action is Mark reviewed (header).
import { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { usePermission } from '@/auth/permissions';
import { AppText, AttachmentList, Badge, Card, InlineAlert, Screen, StateView } from '@/components/common';
import { AnswerSections, PhoneLinks } from '@/features/questionnaires/AnswerSections';
import { ReviewHeaderAction } from '@/features/questionnaires/QuestionnaireActions';
import { groupAnswers } from '@/features/questionnaires/answers';
import { useQuestionnaire } from '@/features/questionnaires/hooks';
import { questionnaireStatusLabel, questionnaireStatusTone } from '@/features/questionnaires/status';
import { formatBytes, openExternally } from '@/lib/attachments';
import { makeStyles } from '@/theme';
import { formatDateTime } from '@/utils/date';
import { plural } from '@/utils/format';

const answerText = (v: string | boolean | undefined) => (typeof v === 'string' ? v.trim() : '');

export default function QuestionnaireDetail() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const can = usePermission();
  const { data: q, isLoading, error, refetch, isRefetching } = useQuestionnaire(id);
  const grouped = useMemo(() => groupAnswers(q?.answers ?? {}), [q]);

  if (isLoading || error || !q) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  const dogName = answerText(q.answers.dogName) || 'Dog';
  const breed = answerText(q.answers.breed);
  const ownerName = answerText(q.answers.ownerName);
  const ownerPhone = answerText(q.answers.ownerPhone);

  return (
    <Screen edges={['bottom']} style={styles.noPad}>
      <Stack.Screen
        options={{ title: dogName, headerRight: () => <ReviewHeaderAction questionnaire={q} canManage={can('forms.manage')} /> }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.between}>
            <AppText variant="heading" style={styles.flex}>{dogName}</AppText>
            <Badge label={questionnaireStatusLabel[q.status]} tone={questionnaireStatusTone[q.status]} />
          </View>
          {!!breed && <AppText variant="caption">{breed}</AppText>}
          <AppText variant="caption">
            {[
              q.createdAt && `Sent ${formatDateTime(q.createdAt)}`,
              q.reviewedAt &&
                q.status !== 'new' &&
                `${questionnaireStatusLabel[q.status]}${q.reviewedByName ? ` by ${q.reviewedByName}` : ''} ${formatDateTime(q.reviewedAt)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
          {(!!ownerName || !!ownerPhone) && (
            <View style={styles.owner}>
              <AppText variant="label" color="textMuted">DOG PARENT</AppText>
              <AppText variant="bodyStrong">{[ownerName, ownerPhone].filter(Boolean).join(' · ')}</AppText>
              {!!ownerPhone && <PhoneLinks phone={ownerPhone} />}
            </View>
          )}
        </Card>

        {grouped.warnings > 0 && (
          <InlineAlert tone="warning" message={`${plural(grouped.warnings, 'answer')} to check before the stay - highlighted below.`} />
        )}

        <Card>
          <AppText variant="label" color="textMuted">VACCINATION AND DEWORMING RECORDS</AppText>
          <AttachmentList
            items={q.documents.map((d) => ({
              ...d,
              meta: [formatBytes(d.size), d.uploadedAt && formatDateTime(d.uploadedAt)].filter(Boolean).join(' · '),
            }))}
            onOpenFile={(item) => void openExternally(item)}
            emptyText="No files attached."
          />
        </Card>

        <AnswerSections sections={grouped.sections} extra={grouped.extra} />
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  noPad: { padding: 0 },
  content: { padding: t.spacing.xl, gap: t.spacing.md, paddingBottom: t.spacing.xxxl },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  owner: { gap: t.spacing.xxs, marginTop: t.spacing.sm },
}));
