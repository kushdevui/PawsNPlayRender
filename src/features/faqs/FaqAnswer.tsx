import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/common';
import { makeStyles } from '@/theme';
import type { FaqBlock } from './faqData';
import { parseInline } from './faqText';

/** Renders one line of FAQ markup: plain text, **bold** and in-app [links](/route). */
function RichText({ source }: { source: string }) {
  const styles = useStyles();
  return (
    <AppText variant="body">
      {parseInline(source).map((seg, i) => {
        if (seg.kind === 'bold') return <AppText key={i} variant="bodyStrong">{seg.text}</AppText>;
        if (seg.kind === 'link') {
          return (
            <AppText
              key={i}
              variant="bodyStrong"
              color="primaryText"
              style={styles.link}
              accessibilityRole="link"
              // Cast: the href is parsed from the FAQ text (a plain string), e.g. /know-your-dog or /faqs.
              onPress={() => router.push(seg.href as Href)}
            >
              {seg.text}
            </AppText>
          );
        }
        return seg.text;
      })}
    </AppText>
  );
}

export function FaqAnswer({ blocks }: { blocks: FaqBlock[] }) {
  const styles = useStyles();
  return (
    <>
      {blocks.map((block, i) =>
        block.type === 'p' ? (
          <RichText key={i} source={block.text} />
        ) : (
          <View key={i} style={styles.list}>
            {block.items.map((item, j) => (
              <View key={j} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <View style={styles.bulletText}>
                  <RichText source={item} />
                </View>
              </View>
            ))}
          </View>
        ),
      )}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  link: { textDecorationLine: 'underline' },
  list: { gap: t.spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm },
  // Dot centred on the first line of body text (lineHeight 22).
  bullet: {
    width: t.spacing.sm - t.spacing.xxs,
    height: t.spacing.sm - t.spacing.xxs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primary,
    marginTop: t.spacing.sm,
  },
  bulletText: { flex: 1 },
}));
