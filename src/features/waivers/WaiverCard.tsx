import { View } from 'react-native';
import type { WaiverListItem } from '@/api/types';
import { AppText, Avatar, Badge, Card } from '@/components/common';
import { makeStyles } from '@/theme';
import { formatDateLong, formatTime } from '@/utils/date';

/** "25 Nov 2026 · 10:00 AM" */
export const formatSignedAt = (iso: string) => (iso ? `${formatDateLong(iso)} · ${formatTime(iso)}` : '');

/** One signed waiver in the admin list: parent, dog, phone, signed date, photo opt-out badge. */
export function WaiverCard({ item, onPress }: { item: WaiverListItem; onPress?: () => void }) {
  const styles = useStyles();
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${item.dogName}, ${item.parentName}, signed ${formatSignedAt(item.signedAt)}${item.photosOptOut ? ', no photos' : ''}`}
    >
      <View style={styles.row}>
        <Avatar name={item.dogName} size={44} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText variant="subheading" numberOfLines={1} style={styles.shrink}>{item.dogName}</AppText>
            {item.photosOptOut && <Badge label="No photos" tone="warning" />}
          </View>
          <AppText variant="caption" numberOfLines={1}>{[item.parentName, item.phone].filter(Boolean).join(' · ')}</AppText>
          <AppText variant="caption" numberOfLines={1}>
            {[item.signedAt && `Signed ${formatSignedAt(item.signedAt)}`, item.version && `v${item.version}`].filter(Boolean).join(' · ')}
          </AppText>
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
}));
