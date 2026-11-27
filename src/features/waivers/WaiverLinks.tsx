// Links on a signed waiver: the linked Know Your Dog form and the linked dog profile (open only).
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Waiver } from '@/api/types';
import { AppText, Button, Card } from '@/components/common';
import { useDog } from '@/features/dogs/hooks';
import { makeStyles } from '@/theme';

export function WaiverLinks({ waiver: w }: { waiver: Waiver }) {
  const styles = useStyles();
  const dog = useDog(w.dogId ?? undefined);
  if (!w.questionnaireId && !w.dogId) return null;

  return (
    <Card>
      <AppText variant="label" color="textMuted">LINKED</AppText>
      <View style={styles.actions}>
        {!!w.questionnaireId && (
          <Button
            title="Know Your Dog form"
            icon="clipboard-text-outline"
            variant="outline"
            onPress={() => router.push({ pathname: '/admin/forms/[id]', params: { id: w.questionnaireId! } })}
          />
        )}
        {!!w.dogId && (
          <Button
            title={dog.data ? `Open ${dog.data.name}` : 'Open dog'}
            icon="paw"
            variant="outline"
            onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: w.dogId! } })}
          />
        )}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.xs },
}));
