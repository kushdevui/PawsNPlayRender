// Renders the waiver text from the API (paragraphs, soft coloured cards with callout notes, bullet lists,
// numbered lists, rate cards, statements) in the style of the printed PDF, plus the consent ticks placed in it.
import type { ComponentRef, ReactNode } from 'react';
import { View } from 'react-native';
import type { WaiverBlock, WaiverConsentDef } from '@/api/types';
import { AppText, Badge, CheckboxField, Icon } from '@/components/common';
import { parseInline } from '@/features/faqs/faqText';
import { makeStyles, useTheme, type TypographyVariant } from '@/theme';

export type FieldRef = (key: string) => (node: ComponentRef<typeof View> | null) => void;

/** Consent state + handlers shared by every block. */
export interface ConsentProps {
  defs: Record<string, WaiverConsentDef>;
  values: Record<string, boolean>;
  errors: Record<string, string>;
  onToggle: (key: string, value: boolean) => void;
  fieldRef: FieldRef;
  disabled?: boolean;
}

/** One line of waiver text with **bold** parts. */
export function RichText({ source, variant = 'body', italic, color }: { source: string; variant?: TypographyVariant; italic?: boolean; color?: 'textMuted' | 'primaryText' }) {
  const styles = useStyles();
  return (
    <AppText variant={variant} color={color} style={italic ? styles.italic : undefined}>
      {parseInline(source).map((seg, i) =>
        seg.kind === 'text' ? seg.text : <AppText key={i} variant={variant} color={color} style={[styles.bold, italic && styles.italic]}>{seg.text}</AppText>,
      )}
    </AppText>
  );
}

/**
 * A consent tick (label from the API). Optional ones get an "Optional" badge. A multi-line label (e.g. acceptRisks:
 * intro, "• " bullets, closing paragraph) repeats the section right above it, so the box shows the short label and
 * points to that section; the full label stays the accessibility label and is what the server stores.
 */
export function ConsentCheck({ consentKey, c, children }: { consentKey: string; c: ConsentProps; children?: ReactNode }) {
  const styles = useStyles();
  const def = c.defs[consentKey];
  if (!def) return null;
  const long = def.label.includes('\n');
  const content =
    children ??
    (long ? (
      <View>
        <AppText variant="bodyStrong">{def.shortLabel || def.label.split('\n')[0]}</AppText>
        <AppText variant="caption">By ticking, you agree to the full text of the section above.</AppText>
      </View>
    ) : undefined);
  return (
    <View ref={c.fieldRef(consentKey)} collapsable={false} style={[styles.consent, !!c.errors[consentKey] && styles.consentError]}>
      <CheckboxField
        label={def.label}
        value={c.values[consentKey] === true}
        onChange={(v) => c.onToggle(consentKey, v)}
        error={c.errors[consentKey]}
        disabled={c.disabled}
      >
        {content}
      </CheckboxField>
      {!def.required && <Badge label="Optional" tone="neutral" />}
    </View>
  );
}

const CARD_TONES = ['infoSoft', 'successSoft', 'primarySoft'] as const;

interface BlockProps {
  block: WaiverBlock;
  /** `${part}:${block}` - used to look up consents placed in this block. */
  at: string;
  /** Index among the part's cards (cycles the soft colours like the PDF). */
  cardIndex: number;
  /** Consent key per numbered item (numbered block that is "What you confirm"). */
  numberedKeys?: (string | null)[];
  /** Consent keys under bullet items, by `${at}:${item}`. */
  afterItem: Record<string, string[]>;
  c: ConsentProps;
}

export function WaiverBlockView({ block, at, cardIndex, numberedKeys, afterItem, c }: BlockProps) {
  const theme = useTheme();
  const styles = useStyles();

  switch (block.type) {
    case 'paragraph':
      return <RichText source={block.text} />;

    case 'card': {
      // "Kennel-free group boarding." reads as a bold lead-in; a title without a full stop is a heading.
      const lead = !!block.title && /[.:]$/.test(block.title.trim());
      return (
        <View style={[styles.box, { backgroundColor: theme.colors[CARD_TONES[cardIndex % CARD_TONES.length]] }]}>
          {!!block.title && !lead && <AppText variant="subheading">{block.title}</AppText>}
          {!!block.text && <RichText source={lead ? `**${block.title}** ${block.text}` : block.text} />}
          {block.items?.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <View style={styles.flex}>
                <RichText source={item} />
              </View>
            </View>
          ))}
          {!!block.note && (
            <View style={styles.note}>
              <Icon name="comment-text-outline" color="warning" size={theme.sizes.iconSm} />
              <View style={styles.flex}>
                <RichText source={block.note} italic />
              </View>
            </View>
          )}
          {!!block.extra && <RichText source={block.extra} />}
        </View>
      );
    }

    case 'bullets':
      return (
        <View style={[styles.box, styles.muted]}>
          {!!block.title && <AppText variant="subheading">{block.title}</AppText>}
          {block.items.map((item, i) => (
            <View key={i} style={styles.itemGroup}>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <View style={styles.flex}>
                  <RichText source={item} />
                </View>
              </View>
              {(afterItem[`${at}:${i}`] ?? []).map((k) => <ConsentCheck key={k} consentKey={k} c={c} />)}
            </View>
          ))}
        </View>
      );

    case 'numbered':
      return (
        <View style={[styles.box, styles.outlined]}>
          {!!block.intro && <RichText source={block.intro} variant="bodyStrong" />}
          {block.items.map((item, i) => {
            const number = (
              <View style={styles.number}>
                <AppText variant="label" color="primaryText">{i + 1}</AppText>
              </View>
            );
            const key = numberedKeys?.[i];
            if (key && c.defs[key]) {
              return (
                <ConsentCheck key={i} consentKey={key} c={c}>
                  <View style={styles.bulletRow}>
                    {number}
                    <View style={styles.flex}>
                      <RichText source={item} />
                    </View>
                  </View>
                </ConsentCheck>
              );
            }
            return (
              <View key={i} style={styles.bulletRow}>
                {number}
                <View style={styles.flex}>
                  <RichText source={item} />
                </View>
              </View>
            );
          })}
        </View>
      );

    case 'rates':
      return (
        <View style={[styles.box, styles.outlined]}>
          {!!block.title && <AppText variant="subheading">{block.title}</AppText>}
          {!!block.text && <RichText source={block.text} />}
          <View style={styles.rates}>
            {block.items.map((r, i) => (
              <View key={i} style={styles.rate}>
                <AppText variant="heading" color="primaryText">{r.price}</AppText>
                <AppText variant="caption">{r.label}</AppText>
              </View>
            ))}
          </View>
        </View>
      );

    case 'statement':
      return (
        <View style={[styles.box, styles.outlined, styles.statement]}>
          <RichText source={block.text} variant="bodyStrong" />
        </View>
      );
  }
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  bold: { fontWeight: t.fontWeight.bold },
  italic: { fontStyle: 'italic' },
  box: { alignSelf: 'stretch', borderRadius: t.radius.lg, padding: t.spacing.lg, gap: t.spacing.sm },
  muted: { backgroundColor: t.colors.surfaceMuted },
  outlined: { backgroundColor: t.colors.surface, borderWidth: t.sizes.borderWidth, borderColor: t.colors.border },
  statement: { borderLeftWidth: t.spacing.xs, borderLeftColor: t.colors.primary },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: t.spacing.sm,
    backgroundColor: t.colors.warningSoft,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginTop: t.spacing.xs,
  },
  itemGroup: { gap: t.spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm },
  // Dot centred on the first line of body text (same as the FAQ lists).
  bullet: {
    width: t.spacing.sm - t.spacing.xxs,
    height: t.spacing.sm - t.spacing.xxs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primary,
    marginTop: t.spacing.sm,
  },
  number: {
    width: t.sizes.iconLg,
    height: t.sizes.iconLg,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rates: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  rate: {
    flexGrow: 1,
    flexBasis: '40%',
    gap: t.spacing.xxs,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.primarySoft,
  },
  consent: {
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radius.md,
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  consentError: { borderColor: t.colors.danger },
}));
