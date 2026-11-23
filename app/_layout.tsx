import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { Logo } from '@/components/common';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider, makeStyles, useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const theme = useTheme();
  const styles = useStyles();
  const status = useSession((s) => s.status);
  const bootstrap = useSession((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <>
      <StatusBar style={theme.colors.statusBar} />
      {status === 'loading' ? (
        <View style={styles.splash}>
          <Logo size={160} />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      )}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.background },
}));
