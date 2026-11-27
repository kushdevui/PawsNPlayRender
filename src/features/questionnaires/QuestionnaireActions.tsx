// Header action on a Know Your Dog submission. The form is filled by the dog parent and is read-only here:
// the team can only mark it reviewed (PATCH /questionnaires/:id { status: 'reviewed' }).
import { View } from 'react-native';
import type { Questionnaire } from '@/api/types';
import { AppText, Button, Icon } from '@/components/common';
import { showAlert } from '@/lib/dialog';
import { makeStyles, useTheme } from '@/theme';
import { useUpdateQuestionnaire } from './hooks';

interface Props {
  questionnaire: Questionnaire;
  /** forms.manage (admin). Staff only see the status. */
  canManage: boolean;
}

/** "Mark reviewed" button, or a "Reviewed" tick once done. Goes in the screen header (top right). */
export function ReviewHeaderAction({ questionnaire: q, canManage }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const update = useUpdateQuestionnaire(q.id);

  if (q.status === 'reviewed') {
    return (
      <View style={styles.done} accessibilityLabel="Reviewed">
        <Icon name="check-circle" color="success" size={theme.sizes.iconSm} />
        <AppText variant="bodyStrong" color="success">Reviewed</AppText>
      </View>
    );
  }
  if (!canManage) return null;

  return (
    <Button
      title="Mark reviewed"
      icon="check"
      size="sm"
      onPress={() =>
        update.mutate({ status: 'reviewed' }, { onError: (e) => showAlert('Could not mark as reviewed', e.message) })
      }
      loading={update.isPending}
      disabled={update.isPending}
    />
  );
}

const useStyles = makeStyles((t) => ({
  done: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs, paddingHorizontal: t.spacing.sm },
}));
