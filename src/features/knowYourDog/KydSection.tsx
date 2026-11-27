// One numbered section of the Know Your Dog form, rendering its fields from kydData.
import type { ComponentRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppText, Card } from '@/components/common';
import { parseInline } from '@/features/faqs/faqText';
import type { LocalFile } from '@/lib/attachments';
import { makeStyles, useTheme } from '@/theme';
import type { FieldDef, KydSection as Section } from './kydData';
import { KydChoiceField, KydConfirmField, KydDateField, KydTextField } from './KydFields';
import { KydDocuments } from './KydDocuments';
import { isFieldVisible, type KydErrors, type KydValues } from './kydLogic';

interface Props {
  section: Section;
  values: KydValues;
  errors: KydErrors;
  onChange: (key: string, value: string | boolean) => void;
  files: LocalFile[];
  onFilesChange: (files: LocalFile[]) => void;
  /** Ref callback per field key, used to scroll to the first error. */
  fieldRef: (key: string) => (node: ComponentRef<typeof View> | null) => void;
  disabled?: boolean;
}

/** Section note with **bold** parts. */
function Note({ source }: { source: string }) {
  return (
    <AppText variant="body" color="textMuted">
      {parseInline(source).map((seg, i) =>
        seg.kind === 'text' ? seg.text : <AppText key={i} variant="bodyStrong">{seg.text}</AppText>,
      )}
    </AppText>
  );
}

export function KydSection({ section, values, errors, onChange, files, onFilesChange, fieldRef, disabled }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const wide = useWindowDimensions().width >= theme.sizes.breakpointWide;
  const s = (k: string) => (typeof values[k] === 'string' ? (values[k] as string) : '');

  const render = (f: FieldDef) => {
    switch (f.kind) {
      case 'text':
        return <KydTextField field={f} value={s(f.key)} error={errors[f.key]} onChange={(v) => onChange(f.key, v)} />;
      case 'choice':
        return <KydChoiceField field={f} value={s(f.key)} error={errors[f.key]} onChange={(v) => onChange(f.key, v)} />;
      case 'date':
        return <KydDateField field={f} value={s(f.key)} error={errors[f.key]} onChange={(v) => onChange(f.key, v)} />;
      case 'confirm':
        return <KydConfirmField field={f} value={values.confirmTrue === true} error={errors[f.key]} onChange={(v) => onChange(f.key, v)} />;
      case 'documents':
        return <KydDocuments label={f.label} files={files} onChange={onFilesChange} disabled={disabled} />;
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.title}>
        <View style={styles.number}>
          <AppText variant="label" color="textInverse">{section.n}</AppText>
        </View>
        <AppText variant="heading" accessibilityRole="header" style={styles.titleText}>{section.title}</AppText>
      </View>
      {!!section.note && <Note source={section.note} />}
      <View style={styles.fields}>
        {section.fields
          .filter((f) => isFieldVisible(f.key, values))
          .map((f) => (
            <View
              key={f.key}
              ref={fieldRef(f.key)}
              collapsable={false}
              style={wide && 'half' in f && f.half ? styles.half : styles.full}
            >
              {render(f)}
            </View>
          ))}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { alignSelf: 'stretch' },
  title: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.xs },
  titleText: { flex: 1 },
  number: {
    width: t.sizes.controlSm - t.spacing.xs,
    height: t.sizes.controlSm - t.spacing.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { flexDirection: 'row', flexWrap: 'wrap', columnGap: t.spacing.md, rowGap: t.spacing.lg, marginTop: t.spacing.md },
  full: { width: '100%' },
  // Two per row: flexBasis below 50% so the column gap fits; a lone half field grows to the full row.
  half: { flexGrow: 1, flexBasis: '40%' },
}));
