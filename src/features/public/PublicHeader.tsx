// Top bar shared by the public pages (/faqs, /know-your-dog, /waiver): logo + name and an optional progress bar (the Know Your Dog form shows how much is filled in).
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Logo, ProgressBar } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';

interface Props {
  /** 0-1. Shows a thin brand progress bar under the bar's content. */
  progress?: number;
  /** Make the name a link to the FAQs (off on the FAQ page itself). */
  linkHome?: boolean;
}

export function PublicHeader({ progress, linkHome = false }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <View style={styles.row}>
          <View style={styles.brand}>
            <Logo size={theme.sizes.logoSm} />
            <AppText
              variant="heading"
              accessibilityRole={linkHome ? 'link' : undefined}
              onPress={linkHome ? () => router.push('/faqs') : undefined}
            >
              Paws N&apos; Play
            </AppText>
          </View>
        </View>
        {progress !== undefined && (
          <View accessibilityLabel={`${Math.round(progress * 100)}% answered`}>
            <ProgressBar value={progress} tone="brand" />
          </View>
        )}
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
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexShrink: 1 },
}));
