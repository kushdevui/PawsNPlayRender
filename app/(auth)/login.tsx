import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { USE_MOCKS } from '@/api/client';
import { useSession } from '@/auth/session';
import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@pawsnplay.com' },
  { label: 'User', email: 'priya@example.com' },
  { label: 'Staff', email: 'neha.staff@pawsnplay.com' },
];

export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return setError('Enter your email and password.');
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // Redirect happens in (auth)/_layout once the session has a user.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <View style={styles.brand}>
          <AppText style={styles.logo}>🐾</AppText>
          <AppText variant="title">PawsNPlay</AppText>
          <AppText variant="caption">Log in to continue</AppText>
        </View>

        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••••" />
        {!!error && <AppText style={styles.error}>{error}</AppText>}
        <Button title="Log in" onPress={submit} loading={loading} />

        <Link href="/register" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <AppText variant="caption">New here? <AppText style={styles.linkText}>Create an account</AppText></AppText>
          </Pressable>
        </Link>

        {USE_MOCKS && (
          <View style={styles.demo}>
            <AppText variant="caption">Mock mode · tap to fill a test account</AppText>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map((a) => (
                <Button key={a.email} size="sm" variant="secondary" title={a.label} onPress={() => { setEmail(a.email); setPassword('password123'); }} />
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center' },
  form: { gap: spacing.md },
  brand: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  logo: { fontSize: 48 },
  error: { color: colors.danger },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.primaryDark, fontWeight: '600' },
  demo: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft, gap: spacing.sm, alignItems: 'center' },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
});
