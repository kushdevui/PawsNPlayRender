// Read-only view of a Know Your Dog submission: the form's sections, answered questions only.
import { View } from 'react-native';
import { AppText, Badge, Button, Card, Divider, Icon, type BadgeTone } from '@/components/common';
import { makeStyles } from '@/theme';
import type { AnswerRow, AnswerSection, AnswerTone } from './answers';
import { openLink, telUrl, whatsAppUrl } from './contact';

const toneBadge: Record<AnswerTone, BadgeTone> = { success: 'success', accent: 'brand', danger: 'danger' };

/** Call + WhatsApp links for a phone number. */
export function PhoneLinks({ phone }: { phone: string }) {
  const styles = useStyles();
  return (
    <View style={styles.links}>
      <Button title="Call" icon="phone-outline" variant="outline" size="sm" onPress={() => void openLink(telUrl(phone))} />
      <Button title="WhatsApp" icon="whatsapp" variant="outline" size="sm" onPress={() => void openLink(whatsAppUrl(phone))} />
    </View>
  );
}

function Row({ row }: { row: AnswerRow }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, row.warn && styles.warn]}>
      <View style={styles.labelRow}>
        {row.warn && <Icon name="alert-outline" color="warning" />}
        <AppText variant="caption" style={styles.flex}>{row.label}</AppText>
      </View>
      {row.tone ? (
        <Badge label={row.value} tone={toneBadge[row.tone]} />
      ) : (
        <AppText variant="body" selectable>{row.value}</AppText>
      )}
      {!!row.note && <AppText variant="body" color="textMuted" selectable>{row.note}</AppText>}
      {row.phone && <PhoneLinks phone={row.value} />}
    </View>
  );
}

function SectionCard({ n, title, rows }: { n?: number; title: string; rows: AnswerRow[] }) {
  const styles = useStyles();
  return (
    <Card>
      <View style={styles.title}>
        {n !== undefined && (
          <View style={styles.number}>
            <AppText variant="label" color="textInverse">{n}</AppText>
          </View>
        )}
        <AppText variant="subheading" accessibilityRole="header" style={styles.flex}>{title}</AppText>
      </View>
      {rows.map((r, i) => (
        <View key={r.key}>
          {i > 0 && !r.warn && !rows[i - 1].warn && <Divider />}
          <Row row={r} />
        </View>
      ))}
    </Card>
  );
}

export function AnswerSections({ sections, extra }: { sections: AnswerSection[]; extra: AnswerRow[] }) {
  return (
    <>
      {sections.map((s) => (
        <SectionCard key={s.n} n={s.n} title={s.title} rows={s.rows} />
      ))}
      {extra.length > 0 && <SectionCard title="Other answers" rows={extra} />}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  title: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.xs },
  number: {
    width: t.sizes.controlSm - t.spacing.xs,
    height: t.sizes.controlSm - t.spacing.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  row: { gap: t.spacing.xs, paddingVertical: t.spacing.sm },
  warn: { backgroundColor: t.colors.warningSoft, borderRadius: t.radius.md, paddingHorizontal: t.spacing.md, marginVertical: t.spacing.xxs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.xxs },
}));
