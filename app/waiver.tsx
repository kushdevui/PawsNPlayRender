// Public "Boarding Consent & Waiver" (/waiver). No RoleGate and no session check: dog parents sign it logged out,
// on the web build (https://pawsnplaywithme.com/waiver) or in the app. The text and consent list come from
// GET /waivers/current (versioned on the server); signing is one POST /waivers. Optional ?questionnaire=<id>
// links the signature to a Know Your Dog form.
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { SignatureData, WaiverReceipt } from '@/api/types';
import { AppText, Button, InlineAlert, Screen, StateView, TextInput } from '@/components/common';
import { useLeaveWarning } from '@/features/knowYourDog/hooks';
import { PublicHeader } from '@/features/public/PublicHeader';
import { WaiverDocument } from '@/features/waivers/WaiverDocument';
import { WaiverDone } from '@/features/waivers/WaiverDone';
import { WaiverSignCard } from '@/features/waivers/WaiverSignCard';
import type { ConsentProps } from '@/features/waivers/WaiverBlocks';
import { isWaiverOutdated, useCurrentWaiver, useSubmitWaiver, waiverErrorMessage } from '@/features/waivers/hooks';
import { buildWaiverLayout } from '@/features/waivers/waiverLayout';
import {
  buildSubmission, emptyWaiverForm, fieldOrder, isTouched, validateWaiver, waiverProgress, type WaiverErrors, type WaiverForm,
  type WaiverTextField,
} from '@/features/waivers/waiverLogic';
import { waiverText } from '@/features/waivers/waiverText';
import { useDocumentTitle } from '@/lib/documentTitle';
import { makeStyles, useTheme } from '@/theme';

export default function WaiverScreen() {
  const theme = useTheme();
  const styles = useStyles();
  useDocumentTitle(waiverText.pageTitle);
  const params = useLocalSearchParams<{ questionnaire?: string }>();
  const questionnaireId = typeof params.questionnaire === 'string' && params.questionnaire ? params.questionnaire : undefined;

  const current = useCurrentWaiver();
  const waiver = current.data;
  const layout = useMemo(() => (waiver ? buildWaiverLayout(waiver.content, waiver.consents) : null), [waiver]);
  const order = useMemo(() => (layout ? fieldOrder(layout) : []), [layout]);
  const defs = useMemo(() => Object.fromEntries((waiver?.consents ?? []).map((c) => [c.key, c])), [waiver]);

  const [form, setForm] = useState<WaiverForm>(emptyWaiverForm);
  const [errors, setErrors] = useState<WaiverErrors>({});
  const [website, setWebsite] = useState(''); // honeypot (web only); real people never see it
  const [formError, setFormError] = useState('');
  const [outdated, setOutdated] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [receipt, setReceipt] = useState<WaiverReceipt | null>(null);
  const submit = useSubmitWaiver();
  useLeaveWarning(!receipt && isTouched(form));

  // Scroll-to-first-error, as on the Know Your Dog form: fields register here; offsets are measured against the column.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const columnRef = useRef<ComponentRef<typeof View>>(null);
  const columnY = useRef(0);
  const fieldNodes = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const fieldRef = useCallback((key: string) => (node: ComponentRef<typeof View> | null) => {
    fieldNodes.current[key] = node;
  }, []);
  const scrollToField = (key: string) => {
    const node = fieldNodes.current[key];
    const column = columnRef.current;
    if (!node || !column) return;
    node.measureLayout(column, (_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, columnY.current + y - theme.spacing.xl), animated: true });
    });
  };

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  const onText = useCallback((key: WaiverTextField, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key);
  }, [clearError]);
  const onSignature = useCallback((signature: SignatureData | null) => {
    setForm((f) => ({ ...f, signature }));
    if (signature) clearError('signature');
  }, [clearError]);
  const onToggle = useCallback((key: string, value: boolean) => {
    setForm((f) => ({ ...f, consents: { ...f.consents, [key]: value } }));
    clearError(key);
  }, [clearError]);

  const consentProps: ConsentProps = { defs, values: form.consents, errors, onToggle, fieldRef, disabled: submit.isPending };

  const onSubmit = () => {
    if (!waiver) return;
    setFormError('');
    setOutdated(false);
    const found = validateWaiver(form, waiver, order);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return scrollToField(first);

    submit.mutate(buildSubmission(waiver, form, { questionnaireId, website: Platform.OS === 'web' ? website : '' }), {
      onSuccess: (r) => {
        setReceipt(r);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      },
      onError: (e) => {
        setOutdated(isWaiverOutdated(e));
        setFormError(waiverErrorMessage(e));
      },
    });
  };

  // 409 WAIVER_OUTDATED: load the new text. Ticks are cleared (they were given to the old text); details stay.
  const reload = () => {
    setOutdated(false);
    setFormError('');
    setErrors({});
    setForm((f) => ({ ...f, consents: {} }));
    submit.reset();
    void current.refetch();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const progress = receipt ? 1 : waiver ? waiverProgress(form, waiver, order) : undefined;

  return (
    <Screen style={styles.screen} keyboardAware>
      <Stack.Screen options={{ title: waiverText.pageTitle }} />
      <PublicHeader progress={progress} linkHome />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!drawing}
      >
        <View
          ref={columnRef}
          collapsable={false}
          style={styles.column}
          onLayout={(e) => {
            columnY.current = e.nativeEvent.layout.y;
          }}
        >
          {receipt ? (
            <WaiverDone receipt={receipt} dogName={form.dogName.trim()} />
          ) : !waiver || !layout ? (
            <View style={styles.state}>
              <StateView
                loading={current.isLoading}
                error={current.error ? new Error(waiverText.loadError) : null}
                onRetry={() => void current.refetch()}
              />
            </View>
          ) : (
            <>
              <WaiverDocument content={waiver.content} layout={layout} c={consentProps} />

              {Platform.OS === 'web' && (
                // Honeypot for bots: off-screen, hidden from screen readers and skipped by Tab.
                <View style={styles.honeypot} aria-hidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
                  <TextInput value={website} onChangeText={setWebsite} label="Leave this empty" autoComplete="off" focusable={false} />
                </View>
              )}

              <WaiverSignCard
                form={form}
                errors={errors}
                onText={onText}
                onSignature={onSignature}
                onDrawingChange={setDrawing}
                consentKeys={layout.signCard}
                c={consentProps}
                fieldRef={fieldRef}
                disabled={submit.isPending}
              />

              <View style={styles.submit}>
                {Object.keys(errors).length > 0 && (
                  <AppText variant="label" color="danger" align="center">{waiverText.checkErrors}</AppText>
                )}
                {!!formError && <InlineAlert message={formError} tone={outdated ? 'warning' : 'error'} />}
                {outdated ? (
                  <Button title={waiverText.reload} icon="refresh" variant="outline" size="lg" onPress={reload} style={styles.submitButton} />
                ) : (
                  <Button
                    title={submit.isPending ? waiverText.sending : waiverText.submit}
                    icon="draw-pen"
                    variant="secondary"
                    size="lg"
                    onPress={onSubmit}
                    loading={submit.isPending}
                    disabled={submit.isPending}
                    style={styles.submitButton}
                  />
                )}
              </View>
            </>
          )}

          <AppText variant="caption" align="center" style={styles.footer}>
            © {new Date().getFullYear()} Paws N&apos; Play Boarding
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { padding: t.spacing.none, gap: t.spacing.none },
  scroll: { flexGrow: 1, alignItems: 'center' },
  column: {
    width: '100%',
    maxWidth: t.sizes.contentMaxWidth,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.lg,
  },
  state: { minHeight: t.sizes.controlLg * 6 },
  honeypot: {
    position: 'absolute',
    width: t.sizes.borderWidth,
    height: t.sizes.borderWidth,
    overflow: 'hidden',
    opacity: 0,
  },
  submit: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.sm },
  submitButton: { alignSelf: 'center', minWidth: t.sizes.controlLg * 4 },
  footer: { paddingTop: t.spacing.xl, paddingBottom: t.spacing.xxl },
}));
