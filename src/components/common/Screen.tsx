import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';

interface Props {
  children: ReactNode;
  /** Scrollable content (forms, long pages). Lists should use FlatList inside a non-scroll Screen. */
  scroll?: boolean;
  /** Vertically centre content (auth screens). */
  centered?: boolean;
  /** Avoid the keyboard (forms). */
  keyboardAware?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

/** Base wrapper for every screen: safe area, theme background, padding. */
export function Screen({ children, scroll = false, centered = false, keyboardAware = false, edges = ['top'], style }: Props) {
  const styles = useStyles();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, centered && styles.centered, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, centered && styles.centered, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.colors.background },
  fill: { flex: 1 },
  content: { padding: t.spacing.xl, gap: t.spacing.md },
  centered: { flexGrow: 1, justifyContent: 'center' },
}));
