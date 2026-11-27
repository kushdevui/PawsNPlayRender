// Public FAQ page (/faqs). No RoleGate and no session check: it renders for logged-out
// visitors on phones and on the web build (https://pawsnplaywithme.com/faqs).
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Stack } from 'expo-router';
import { AccordionItem, AppText, Chip, Screen, SearchBar } from '@/components/common';
import { FaqAnswer } from '@/features/faqs/FaqAnswer';
import { FaqHero } from '@/features/faqs/FaqHero';
import { faqSections } from '@/features/faqs/faqData';
import { filterSections } from '@/features/faqs/faqText';
import { PublicHeader } from '@/features/public/PublicHeader';
import { useDocumentTitle } from '@/lib/documentTitle';
import { makeStyles, useTheme } from '@/theme';

const TITLE = "FAQs | Paws N' Play";

export default function FaqsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const wide = width >= theme.sizes.breakpointWide;
  useDocumentTitle(TITLE);

  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const visible = filterSections(faqSections, query);
  const shown = visible.reduce((n, s) => n + s.items.length, 0);

  // Topic chips scroll to a section: keep each section's y inside the scroll content.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const columnY = useRef(0);
  const sectionY = useRef<Record<string, number>>({});
  const pendingScroll = useRef<string | null>(null);

  const scrollToSection = useCallback((id: string) => {
    const y = sectionY.current[id];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, columnY.current + y - theme.spacing.md), animated: true });
  }, [theme.spacing.md]);

  // Typing filters questions and opens every match (clearing the box collapses them again).
  const onSearch = (text: string) => {
    setQuery(text);
    const matches = filterSections(faqSections, text);
    setOpenIds(new Set(text.trim() ? matches.flatMap((s) => s.items.map((i) => i.id)) : []));
  };

  const onTopic = (id: string) => {
    if (visible.some((s) => s.id === id)) return scrollToSection(id);
    // Section hidden by the search: clear it, then scroll once the section is laid out again.
    pendingScroll.current = id;
    onSearch('');
  };

  const onSectionLayout = (id: string) => (e: LayoutChangeEvent) => {
    sectionY.current[id] = e.nativeEvent.layout.y;
    if (pendingScroll.current === id) {
      pendingScroll.current = null;
      scrollToSection(id);
    }
  };

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen style={styles.screen}>
      <Stack.Screen options={{ title: TITLE }} />
      <PublicHeader />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column} onLayout={(e) => {
          columnY.current = e.nativeEvent.layout.y;
        }}>
          <FaqHero wide={wide} />

          <View style={styles.tools}>
            <SearchBar value={query} onChangeText={onSearch} placeholder="Search, e.g. vaccination, food, payment" />
            <View style={styles.chips} accessibilityLabel="Topics">
              {faqSections.map((s) => (
                <Chip key={s.id} label={s.chip} onPress={() => onTopic(s.id)} />
              ))}
            </View>
          </View>

          {/* ~23 static items, so a plain map in the ScrollView is fine (and keeps section offsets for the chips). */}
          {visible.map((section) => (
            <View key={section.id} style={styles.section} onLayout={onSectionLayout(section.id)}>
              <View style={styles.sectionTitle}>
                <View style={styles.dot} />
                <AppText variant="heading" accessibilityRole="header">{section.title}</AppText>
              </View>
              {section.items.map((item) => (
                <AccordionItem key={item.id} title={item.question} expanded={openIds.has(item.id)} onToggle={() => toggle(item.id)}>
                  <FaqAnswer blocks={item.answer} />
                </AccordionItem>
              ))}
            </View>
          ))}

          {shown === 0 && (
            <AppText variant="bodyStrong" color="textMuted" align="center" style={styles.empty}>
              No questions match your search. Try another word.
            </AppText>
          )}

          {/* TODO(contact): "Still have a question?" box with phone / WhatsApp / email once we have contact details. */}

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
    gap: t.spacing.md,
  },
  tools: { gap: t.spacing.md, marginTop: t.spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  section: { gap: t.spacing.sm, paddingTop: t.spacing.lg },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.xs },
  dot: { width: t.spacing.md, height: t.spacing.md, borderRadius: t.radius.pill, backgroundColor: t.colors.primary },
  empty: { paddingVertical: t.spacing.xxl },
  footer: { paddingTop: t.spacing.xxxl, paddingBottom: t.spacing.xxl },
}));
