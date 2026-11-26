import { View } from 'react-native';
import type { QuestionnaireListItem } from '@/api/types';
import { AppText, Avatar, Badge, Card, Icon } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { formatDateTime } from '@/utils/date';
import { questionnaireStatusLabel, questionnaireStatusTone } from './status';

/** One "Know Your Dog" submission in the forms list. */
export function QuestionnaireCard({ item, onPress }: { item: QuestionnaireListItem; onPress?: () => void }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={`${item.dogName}, ${item.ownerName}, ${questionnaireStatusLabel[item.status]}`}>
      <View style={styles.row}>
        <Avatar name={item.dogName} size={44} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText variant="subheading" numberOfLines={1} style={styles.shrink}>{item.dogName}</AppText>
            <Badge label={questionnaireStatusLabel[item.status]} tone={questionnaireStatusTone[item.status]} />
          </View>
          {!!item.breed && <AppText variant="caption" numberOfLines={1}>{item.breed}</AppText>}
          <AppText variant="caption" numberOfLines={1}>{[item.ownerName, item.ownerPhone].filter(Boolean).join(' · ')}</AppText>
          <View style={styles.metaRow}>
            <AppText variant="caption" style={styles.shrink} numberOfLines={1}>
              {item.createdAt ? `Sent ${formatDateTime(item.createdAt)}` : ''}
            </AppText>
            {item.documentsCount > 0 && (
              <View style={styles.files} accessibilityLabel={`${item.documentsCount} files attached`}>
                <Icon name="paperclip" size={theme.sizes.iconSm} color="textMuted" />
                <AppText variant="caption">{item.documentsCount}</AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
  body: { flex: 1, gap: t.spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm },
  shrink: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm, marginTop: t.spacing.xxs },
  files: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs },
}));
