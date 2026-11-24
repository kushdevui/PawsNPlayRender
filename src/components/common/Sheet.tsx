import { useEffect, type ReactNode } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: ReactNode;
  /** Optional footer actions (e.g. Cancel / Done). */
  footer?: ReactNode;
  /** Let children manage their own scrolling (e.g. a FlatList). */
  scrollable?: boolean;
}

/** Bottom sheet style modal (Paper Portal + Modal) used by pickers and quick forms. */
export function Sheet({ visible, onDismiss, title, children, footer, scrollable = true }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} style={styles.modal}>
        <View style={styles.handle} />
        {(title || !footer) && (
          <View style={styles.header}>
            {!!title && <AppText variant="subheading" style={styles.title}>{title}</AppText>}
            {!footer && <Button title="Close" variant="ghost" size="sm" onPress={onDismiss} />}
          </View>
        )}
        {scrollable ? (
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.body, styles.fixedBody]}>{children}</View>
        )}
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </Modal>
    </Portal>
  );
}

const useStyles = makeStyles((t) => ({
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.sm,
    maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: t.radius.pill, backgroundColor: t.colors.border, marginBottom: t.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.md, minHeight: t.sizes.controlSm },
  title: { flex: 1 },
  body: { flexGrow: 0 },
  fixedBody: { flexShrink: 1 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm, marginTop: t.spacing.lg },
}));
