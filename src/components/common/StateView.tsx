// Loading / error / empty states for data screens.
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

/** Renders a full-area state view, or null when content should render. */
export function StateView({ loading, error, empty, emptyText = 'Nothing here yet.', onRetry }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <AppText align="center">{error.message || 'Something went wrong.'}</AppText>
        {onRetry && <Button title="Try again" variant="outline" size="sm" onPress={onRetry} />}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <AppText variant="caption" align="center">{emptyText}</AppText>
      </View>
    );
  }
  return null;
}

const useStyles = makeStyles((t) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.md, padding: t.spacing.xl },
}));
