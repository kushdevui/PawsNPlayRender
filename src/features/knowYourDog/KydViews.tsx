// Static parts of the Know Your Dog page: the hero above the form and the thank-you view after sending.
import { View } from 'react-native';
import { AppText, Button, Icon, Logo } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { kydIntro, kydText } from './kydData';

export function KydHero({ wide }: { wide: boolean }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.hero}>
      <Logo size={theme.sizes.logoLg} />
      <AppText variant={wide ? 'display' : 'title'} align="center" accessibilityRole="header">
        {kydIntro.title}
      </AppText>
      {kydIntro.paragraphs.map((p) => (
        <AppText key={p} variant="body" color="textMuted" align="center" style={styles.intro}>{p}</AppText>
      ))}
      <View style={styles.pill}>
        <AppText variant="label" color="primaryText">{kydIntro.pill}</AppText>
      </View>
    </View>
  );
}

export function KydDone({ dogName, onAnother }: { dogName: string; onAnother: () => void }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.done} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <View style={styles.tick}>
        <Icon name="check-bold" color="success" size={theme.sizes.iconLg * 1.5} />
      </View>
      <AppText variant="title" align="center" accessibilityRole="header">{kydText.doneTitle}</AppText>
      <AppText variant="body" color="textMuted" align="center" style={styles.intro}>{kydText.doneText(dogName)}</AppText>
      <View style={styles.actions}>
        <Button title={kydText.another} variant="outline" onPress={onAnother} icon="paw" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xxl, paddingBottom: t.spacing.sm },
  intro: { maxWidth: t.sizes.contentMaxWidth * 0.7 },
  pill: {
    backgroundColor: t.colors.primarySoft,
    borderRadius: t.radius.pill,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
  },
  done: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xxxl, paddingBottom: t.spacing.xxxl },
  tick: {
    width: t.sizes.controlLg + t.spacing.lg,
    height: t.sizes.controlLg + t.spacing.lg,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: t.spacing.sm, marginTop: t.spacing.sm },
}));
