// Admin actions on a Know Your Dog submission: status (new / reviewed / archived) and the linked dog profile.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Questionnaire, QuestionnaireStatus, QuestionnaireUpdate } from '@/api/types';
import { AppText, Button, Card, InfoRow, InlineAlert, SelectSheet, type ButtonVariant, type IconName } from '@/components/common';
import { useDog, useDogOptions } from '@/features/dogs/hooks';
import { makeStyles } from '@/theme';
import { useUpdateQuestionnaire } from './hooks';

interface Props {
  questionnaire: Questionnaire;
  /** forms.manage - without it the card is read-only (staff). */
  canManage: boolean;
}

const STATUS_ACTIONS: Record<QuestionnaireStatus, Array<{ to: QuestionnaireStatus; title: string; icon: IconName; variant: ButtonVariant }>> = {
  new: [
    { to: 'reviewed', title: 'Mark reviewed', icon: 'check', variant: 'primary' },
    { to: 'archived', title: 'Archive', icon: 'archive-outline', variant: 'outline' },
  ],
  reviewed: [
    { to: 'archived', title: 'Archive', icon: 'archive-outline', variant: 'outline' },
    { to: 'new', title: 'Mark as new', icon: 'email-mark-as-unread', variant: 'ghost' },
  ],
  archived: [
    { to: 'reviewed', title: 'Mark reviewed', icon: 'check', variant: 'outline' },
    { to: 'new', title: 'Mark as new', icon: 'email-mark-as-unread', variant: 'ghost' },
  ],
};

export function QuestionnaireActions({ questionnaire: q, canManage }: Props) {
  const styles = useStyles();
  const update = useUpdateQuestionnaire(q.id);
  const linkedDog = useDog(q.dogId ?? undefined);
  const dogOptions = useDogOptions(true);
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (key: string, body: QuestionnaireUpdate) => {
    setError(null);
    setPending(key);
    update.mutate(body, { onError: (e) => setError(e.message), onSettled: () => setPending(null) });
  };

  const dog = linkedDog.data;

  return (
    <>
      {!!error && <InlineAlert message={error} />}

      {canManage && (
        <View style={styles.actions}>
          {STATUS_ACTIONS[q.status].map((a) => (
            <Button
              key={a.to}
              title={a.title}
              icon={a.icon}
              variant={a.variant}
              onPress={() => run(a.to, { status: a.to })}
              loading={pending === a.to}
              disabled={update.isPending}
              style={styles.flex}
              fullWidth
            />
          ))}
        </View>
      )}

      <Card>
        <AppText variant="label" color="textMuted">DOG PROFILE</AppText>
        {q.dogId ? (
          <>
            <InfoRow icon="dog" label="Linked to" value={dog ? [dog.name, dog.breed].filter(Boolean).join(' · ') : linkedDog.isLoading ? 'Loading…' : 'Dog not found'} />
            {dog && <InfoRow icon="account-outline" label="Owner" value={[dog.ownerName, dog.ownerPhone].filter(Boolean).join(' · ')} />}
            <View style={styles.wrap}>
              {dog && (
                <Button title="Open dog profile" icon="paw" size="sm" onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: dog.id } })} />
              )}
              {canManage && (
                <>
                  <Button title="Change" icon="swap-horizontal" variant="outline" size="sm" onPress={() => setPicking(true)} disabled={update.isPending} />
                  <Button title="Unlink" icon="link-variant-off" variant="ghost" size="sm" onPress={() => run('unlink', { dogId: null })} loading={pending === 'unlink'} disabled={update.isPending} />
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <AppText variant="caption">
              {canManage ? 'Not linked yet. Link it to the dog’s profile, or create a new profile from these answers.' : 'Not linked to a dog profile yet.'}
            </AppText>
            {canManage && (
              <View style={styles.wrap}>
                <Button title="Create dog from this form" icon="plus" size="sm" onPress={() => router.push({ pathname: '/admin/dog/new', params: { fromForm: q.id } })} />
                <Button title="Link to existing dog" icon="link-variant" variant="outline" size="sm" onPress={() => setPicking(true)} disabled={update.isPending} />
              </View>
            )}
          </>
        )}
      </Card>

      <SelectSheet
        visible={picking}
        onDismiss={() => setPicking(false)}
        title="Link to dog"
        options={dogOptions.options}
        value={q.dogId}
        onSelect={(dogId) => run('link', { dogId })}
        searchable
        emptyText={dogOptions.isLoading ? 'Loading dogs…' : 'No dogs found'}
      />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  actions: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.xs },
}));
