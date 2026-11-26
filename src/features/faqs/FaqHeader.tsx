import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Logo } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { quickFacts } from './faqData';

/** Top bar of the public pages: logo + name, and a way in for the team. */
export function FaqHeader() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <Logo size={theme.sizes.logoSm} />
          <AppText variant="heading">Paws N&apos; Play</AppText>
        </View>
        <Button title="Team login" variant="outline" size="sm" onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}

/** Hero: big logo, headline, intro and the quick-facts grid. */
export function FaqHero({ wide }: { wide: boolean }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.hero}>
      <Logo size={theme.sizes.logoLg} />
      <AppText variant={wide ? 'display' : 'title'} align="center" accessibilityRole="header">
        Questions? We&apos;ve got answers.
      </AppText>
      <AppText variant="body" color="textMuted" align="center" style={styles.intro}>
        Everything dog parents usually ask before a stay at Paws N&apos; Play Boarding: booking, timings, payments, health and what to pack.
      </AppText>
      <View style={styles.facts} accessibilityLabel="Quick facts">
        {quickFacts.map((f) => (
          <View key={f.label} style={[styles.fact, wide ? styles.factWide : styles.factNarrow]}>
            <AppText variant="heading">{f.value}</AppText>
            <AppText variant="caption">{f.label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    backgroundColor: t.colors.background,
    borderBottomWidth: t.sizes.borderWidth,
    borderBottomColor: t.colors.border,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: t.sizes.contentMaxWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexShrink: 1 },
  hero: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xxl },
  intro: { maxWidth: t.sizes.contentMaxWidth * 0.65 },
  facts: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
    marginTop: t.spacing.lg,
  },
  fact: {
    flexGrow: 1,
    backgroundColor: t.colors.surfaceMuted,
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.primarySoft,
    borderRadius: t.radius.lg,
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.xxs,
  },
  // Two per row on phones, four in a row on wide screens (gap is subtracted by flexGrow).
  factNarrow: { flexBasis: '40%' },
  factWide: { flexBasis: '20%' },
}));
