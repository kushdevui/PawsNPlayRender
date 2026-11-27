// "Your signature" card: parent, dog and phone, today's date, remaining consents (finalAgreement last),
// the signature pad and the typed name that must match the parent's name.
import type { ComponentRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { SignatureData } from '@/api/types';
import { AppText, Card, Icon, SignaturePad, TextInput } from '@/components/common';
import { FieldLabel } from '@/features/knowYourDog/KydFields';
import { makeStyles, useTheme } from '@/theme';
import { formatDateLong } from '@/utils/date';
import { ConsentCheck, type ConsentProps } from './WaiverBlocks';
import type { WaiverForm, WaiverTextField } from './waiverLogic';
import { waiverText } from './waiverText';

interface Props {
  form: WaiverForm;
  errors: Record<string, string>;
  onText: (key: WaiverTextField, value: string) => void;
  onSignature: (value: SignatureData | null) => void;
  /** true while drawing - the screen stops its ScrollView. */
  onDrawingChange: (drawing: boolean) => void;
  /** Consents shown here (from the layout), finalAgreement last. */
  consentKeys: string[];
  c: ConsentProps;
  fieldRef: (key: string) => (node: ComponentRef<typeof View> | null) => void;
  disabled?: boolean;
}

export function WaiverSignCard({ form, errors, onText, onSignature, onDrawingChange, consentKeys, c, fieldRef, disabled }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const wide = useWindowDimensions().width >= theme.sizes.breakpointWide;

  const text = (key: WaiverTextField, label: string, opts: { phone?: boolean; autoComplete?: 'name' | 'tel' | 'off'; hint?: string } = {}) => (
    <View ref={fieldRef(key)} collapsable={false} style={wide && key !== 'typedSignature' ? styles.half : styles.full}>
      <FieldLabel label={label} hint={opts.hint} required />
      <TextInput
        value={form[key]}
        onChangeText={(v) => onText(key, v)}
        error={errors[key]}
        maxLength={opts.phone ? 20 : 100}
        keyboardType={opts.phone ? 'phone-pad' : 'default'}
        autoComplete={opts.autoComplete}
        autoCapitalize={opts.phone ? 'none' : 'words'}
        accessibilityLabel={label}
        editable={!disabled}
      />
    </View>
  );

  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">{waiverText.signTitle}</AppText>
      <AppText variant="caption">{waiverText.signHint}</AppText>

      <View style={styles.fields}>
        {text('parentName', waiverText.parentName, { autoComplete: 'name' })}
        {text('dogName', waiverText.dogName, { autoComplete: 'off' })}
        {text('phone', waiverText.phone, { phone: true, autoComplete: 'tel' })}
        <View style={wide ? styles.half : styles.full}>
          <FieldLabel label={waiverText.date} />
          <View style={styles.date} accessibilityLabel={`${waiverText.date}: ${formatDateLong(new Date())}`}>
            <Icon name="calendar" color="textMuted" />
            <AppText variant="body">{formatDateLong(new Date())}</AppText>
          </View>
        </View>

        {consentKeys.map((k) => (
          <View key={k} style={styles.full}>
            <ConsentCheck consentKey={k} c={c} />
          </View>
        ))}

        <View ref={fieldRef('signature')} collapsable={false} style={styles.full}>
          <SignaturePad
            label={waiverText.signature}
            required
            value={form.signature}
            onChange={onSignature}
            onDrawingChange={onDrawingChange}
            error={errors.signature}
            disabled={disabled}
          />
        </View>

        {text('typedSignature', waiverText.typedSignature, { autoComplete: 'name', hint: waiverText.typedSignatureHint })}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { alignSelf: 'stretch', marginTop: t.spacing.lg },
  fields: { flexDirection: 'row', flexWrap: 'wrap', columnGap: t.spacing.md, rowGap: t.spacing.lg, marginTop: t.spacing.md },
  full: { width: '100%' },
  // Two per row on wide screens (same as the Know Your Dog form).
  half: { flexGrow: 1, flexBasis: '40%' },
  date: {
    minHeight: t.sizes.controlMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.surfaceMuted,
  },
}));
