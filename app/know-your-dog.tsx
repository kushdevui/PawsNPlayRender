// Public "Know Your Dog" questionnaire (/know-your-dog). No RoleGate and no session check: dog parents fill it
// logged out, on the web build (https://pawsnplaywithme.com/know-your-dog) or in the app. Posts to POST /questionnaires.
import { useCallback, useRef, useState } from 'react';
import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import { AppText, Button, InlineAlert, Screen, TextInput } from '@/components/common';
import { KydSection } from '@/features/knowYourDog/KydSection';
import { KydDone, KydHero } from '@/features/knowYourDog/KydViews';
import { kydSections, kydText } from '@/features/knowYourDog/kydData';
import { buildAnswers, initialValues, progressOf, validate, type KydErrors, type KydValues } from '@/features/knowYourDog/kydLogic';
import { submitErrorMessage, useLeaveWarning, useSubmitQuestionnaire } from '@/features/knowYourDog/hooks';
import { PublicHeader } from '@/features/public/PublicHeader';
import type { LocalFile } from '@/lib/attachments';
import { useDocumentTitle } from '@/lib/documentTitle';
import { makeStyles, useTheme } from '@/theme';

const TITLE = "Know Your Dog | Paws N' Play";
// Progress of an untouched form (the date is pre-filled): above this, leaving the page asks first.
const UNTOUCHED = progressOf(initialValues());

export default function KnowYourDogScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const wide = width >= theme.sizes.breakpointWide;
  useDocumentTitle(TITLE);

  const [values, setValues] = useState<KydValues>(initialValues);
  const [errors, setErrors] = useState<KydErrors>({});
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [website, setWebsite] = useState(''); // honeypot (web only); real people never see it
  const [formError, setFormError] = useState('');
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const submit = useSubmitQuestionnaire();

  const progress = doneFor !== null ? 1 : progressOf(values);
  useLeaveWarning(doneFor === null && (progress > UNTOUCHED || files.length > 0));

  // Scroll-to-first-error: field wrappers register here; offsets are measured against the form column.
  const scrollRef = useRef<ScrollView>(null);
  const columnRef = useRef<View>(null);
  const columnY = useRef(0);
  const fieldNodes = useRef<Record<string, View | null>>({});
  const fieldRef = useCallback((key: string) => (node: View | null) => {
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

  const onChange = useCallback((key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as it is edited.
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const onSubmit = () => {
    setFormError('');
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return scrollToField(first);

    submit.mutate(
      { answers: buildAnswers(values), files, website: Platform.OS === 'web' ? website : '' },
      {
        onSuccess: () => {
          setDoneFor(String(values.dogName ?? '').trim());
          scrollRef.current?.scrollTo({ y: 0, animated: false });
        },
        onError: (e) => setFormError(submitErrorMessage(e)),
      },
    );
  };

  const startAgain = () => {
    setValues(initialValues());
    setErrors({});
    setFiles([]);
    setWebsite('');
    setFormError('');
    setDoneFor(null);
    submit.reset();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <Screen style={styles.screen} keyboardAware>
      <Stack.Screen options={{ title: TITLE }} />
      <PublicHeader progress={progress} linkHome />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View
          ref={columnRef}
          collapsable={false}
          style={styles.column}
          onLayout={(e) => {
            columnY.current = e.nativeEvent.layout.y;
          }}
        >
          {doneFor !== null ? (
            <KydDone dogName={doneFor} onAnother={startAgain} onFaqs={() => router.push('/faqs')} />
          ) : (
            <>
              <KydHero wide={wide} />

              {Platform.OS === 'web' && (
                // Honeypot for bots: off-screen, hidden from screen readers and skipped by Tab.
                <View style={styles.honeypot} aria-hidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
                  <TextInput value={website} onChangeText={setWebsite} label="Leave this empty" autoComplete="off" focusable={false} />
                </View>
              )}

              {kydSections.map((section) => (
                <KydSection
                  key={section.n}
                  section={section}
                  values={values}
                  errors={errors}
                  onChange={onChange}
                  files={files}
                  onFilesChange={setFiles}
                  fieldRef={fieldRef}
                  disabled={submit.isPending}
                />
              ))}

              <View style={styles.submit}>
                {Object.keys(errors).length > 0 && (
                  <AppText variant="label" color="danger" align="center">Please check the highlighted answers above.</AppText>
                )}
                {!!formError && <InlineAlert message={formError} />}
                <Button
                  title={submit.isPending ? kydText.sending : kydText.submit}
                  variant="secondary"
                  size="lg"
                  onPress={onSubmit}
                  loading={submit.isPending}
                  disabled={submit.isPending}
                  style={styles.submitButton}
                />
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
