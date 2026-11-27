import { View } from 'react-native';
import { AppText, Logo } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { quickFacts } from './faqData';

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
