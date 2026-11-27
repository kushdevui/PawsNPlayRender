// The waiver text (title, intro, Part A / Part B sections) with each consent tick placed after the text it confirms.
import { View, useWindowDimensions } from 'react-native';
import type { WaiverContent, WaiverPart } from '@/api/types';
import { AppText, Logo } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { ConsentCheck, RichText, WaiverBlockView, type ConsentProps } from './WaiverBlocks';
import type { WaiverLayout } from './waiverLayout';

/** "Part A" (warm) / "Part B" (cool) pill, like the PDF. */
function PartPill({ label }: { label: NonNullable<WaiverPart['label']> }) {
  const styles = useStyles();
  const a = label === 'Part A';
  return (
    <View style={[styles.pill, a ? styles.pillA : styles.pillB]}>
      <AppText variant="label" color={a ? 'warning' : 'info'}>{label}</AppText>
    </View>
  );
}

function PartView({ part, index, layout, c }: { part: WaiverPart; index: number; layout: WaiverLayout; c: ConsentProps }) {
  const styles = useStyles();
  let cards = 0;
  return (
    <View style={styles.part}>
      <View style={styles.partTitle}>
        {part.label && <PartPill label={part.label} />}
        <AppText variant="heading" accessibilityRole="header" style={styles.flex}>{part.title}</AppText>
      </View>
      {part.blocks.map((block, bi) => {
        const at = `${index}:${bi}`;
        const cardIndex = block.type === 'card' ? cards++ : 0;
        return (
          <View key={at} style={styles.blockGroup}>
            <WaiverBlockView
              block={block}
              at={at}
              cardIndex={cardIndex}
              numberedKeys={layout.numbered[at]}
              afterItem={layout.afterItem}
              c={c}
            />
            {(layout.afterBlock[at] ?? []).map((k) => <ConsentCheck key={k} consentKey={k} c={c} />)}
          </View>
        );
      })}
      {(layout.afterPart[index] ?? []).map((k) => <ConsentCheck key={k} consentKey={k} c={c} />)}
    </View>
  );
}

export function WaiverDocument({ content, layout, c }: { content: WaiverContent; layout: WaiverLayout; c: ConsentProps }) {
  const theme = useTheme();
  const styles = useStyles();
  const wide = useWindowDimensions().width >= theme.sizes.breakpointWide;
  return (
    <>
      <View style={styles.hero}>
        <Logo size={theme.sizes.logoLg} />
        <AppText variant={wide ? 'display' : 'title'} align="center" accessibilityRole="header">{content.title}</AppText>
        {content.intro.map((p, i) => (
          <View key={i} style={styles.intro}>
            <RichText source={p} variant={i === 0 ? 'bodyStrong' : 'body'} />
          </View>
        ))}
        {!!content.version && <AppText variant="caption">Version {content.version}</AppText>}
      </View>
      {content.parts.map((part, i) => (
        <PartView key={part.id || i} part={part} index={i} layout={layout} c={c} />
      ))}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  hero: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xxl, paddingBottom: t.spacing.sm },
  intro: { alignSelf: 'stretch' },
  part: { gap: t.spacing.md, paddingTop: t.spacing.lg },
  partTitle: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' },
  pill: { borderRadius: t.radius.pill, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs },
  pillA: { backgroundColor: t.colors.warningSoft },
  pillB: { backgroundColor: t.colors.infoSoft },
  blockGroup: { gap: t.spacing.sm },
}));
