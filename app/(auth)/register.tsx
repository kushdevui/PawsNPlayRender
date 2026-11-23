import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/auth/session';
import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function RegisterScreen() {
  const signUp = useSession((s) => s.signUp);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name || !form.email || form.password.length < 8) {
      return setError('Name, email and a password of at least 8 characters are required.');
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone || undefined });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <AppText variant="title" style={styles.title}>Create account</AppText>
      <TextField label="Full name" value={form.name} onChangeText={set('name')} autoComplete="name" />
      <TextField label="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextField label="Phone (optional)" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
      <TextField label="Password" value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" />
      {!!error && <AppText style={styles.error}>{error}</AppText>}
      <Button title="Sign up" onPress={submit} loading={loading} />
      <Button title="I already have an account" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginVertical: spacing.lg },
  error: { color: colors.danger },
});
