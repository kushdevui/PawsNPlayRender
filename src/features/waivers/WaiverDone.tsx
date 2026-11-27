// Thank-you view after the waiver is signed: signed date/time and the reference id.
import { View } from 'react-native';
import type { WaiverReceipt } from '@/api/types';
import { AppText, Icon } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { formatDateLong, formatTime } from '@/utils/date';
import { waiverText } from './waiverText';

export function WaiverDone({ receipt, dogName }: { receipt: WaiverReceipt; dogName: string }) {
  const theme = useTheme();
  const styles = useStyles();
  const signed = receipt.signedAt ? `${formatDateLong(receipt.signedAt)} · ${formatTime(receipt.signedAt)}` : '';
  return (
    <View style={styles.done} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <View style={styles.tick}>
        <Icon name="check-bold" color="success" size={theme.sizes.iconLg * 1.5} />
      </View>
      <AppText variant="title" align="center" accessibilityRole="header">{waiverText.doneTitle}</AppText>
      <AppText variant="body" color="textMuted" align="center" style={styles.text}>{waiverText.doneText(dogName)}</AppText>
      <View style={styles.receipt}>
        {!!signed && (
          <AppText variant="body" align="center">
            {waiverText.signedAt}: <AppText variant="bodyStrong">{signed}</AppText>
          </AppText>
        )}
        {!!receipt.id && (
          <AppText variant="body" align="center" selectable>
            {waiverText.reference}: <AppText variant="bodyStrong">{receipt.id}</AppText>
          </AppText>
        )}
        {!!receipt.version && <AppText variant="caption" align="center">Waiver version {receipt.version}</AppText>}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  done: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xxxl, paddingBottom: t.spacing.xxxl },
  text: { maxWidth: t.sizes.contentMaxWidth * 0.7 },
  tick: {
    width: t.sizes.controlLg + t.spacing.lg,
    height: t.sizes.controlLg + t.spacing.lg,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receipt: {
    alignSelf: 'stretch',
    gap: t.spacing.xs,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceMuted,
  },
}));
