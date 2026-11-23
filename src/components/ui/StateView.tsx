// Loading / error / empty states for data screens.
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

/** Returns a full-area state view, or null when content should render. */
export function StateView({ loading, error, empty, emptyText = 'Nothing here yet.', onRetry }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <AppText style={styles.text}>{error.message || 'Something went wrong.'}</AppText>
        {onRetry && <Button title="Try again" variant="secondary" size="sm" onPress={onRetry} />}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <AppText variant="caption" style={styles.text}>{emptyText}</AppText>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  text: { textAlign: 'center' },
});
