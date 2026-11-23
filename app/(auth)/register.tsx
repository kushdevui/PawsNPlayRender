// Basic sign-up using common components. Full flow/design comes later.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/auth/session';
import { AppText, Button, InlineAlert, Logo, Screen, TextInput } from '@/components/common';
import { makeStyles } from '@/theme';

export default function RegisterScreen() {
  const styles = useStyles();
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
    <Screen scroll keyboardAware edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Logo size={88} />
        <AppText variant="heading" align="center">Create your account</AppText>
      </View>
      {!!error && <InlineAlert message={error} />}
      <TextInput label="Full name" value={form.name} onChangeText={set('name')} leftIcon="account-outline" autoComplete="name" />
      <TextInput label="Email" value={form.email} onChangeText={set('email')} leftIcon="email-outline" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <TextInput label="Phone (optional)" value={form.phone} onChangeText={set('phone')} leftIcon="phone-outline" keyboardType="phone-pad" autoComplete="tel" />
      <TextInput label="Password" value={form.password} onChangeText={set('password')} leftIcon="lock-outline" password autoComplete="new-password" helperText="At least 8 characters" />
      <Button title="Sign up" onPress={submit} loading={loading} fullWidth size="lg" />
      <View style={styles.footer}>
        <AppText variant="caption">Already have an account?</AppText>
        <Button title="Log in" variant="link" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { alignItems: 'center', gap: t.spacing.sm, marginVertical: t.spacing.lg },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.xs },
}));
