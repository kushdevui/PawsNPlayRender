import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { USE_MOCKS } from '@/api/client';
import { useSession } from '@/auth/session';
import { AppText, Button, Divider, InlineAlert, Logo, Screen, TextInput } from '@/components/common';
import { makeStyles } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin test accounts (mock mode). Password for all: password123
const DEMO_ACCOUNTS = [
  { label: 'Kush', email: 'kush@pawsnplay.com' },
  { label: 'Divya', email: 'divya@pawsnplay.com' },
  { label: 'Shreya', email: 'shreya@pawsnplay.com' },
];

type Errors = { email?: string; password?: string };

const validate = (email: string, password: string): Errors => ({
  email: !email.trim() ? 'Enter your email' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email' : undefined,
  password: !password ? 'Enter your password' : undefined,
});

export default function LoginScreen() {
  const styles = useStyles();
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next = validate(email, password);
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      // (auth)/_layout redirects to the role's home once the session has a user.
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrors({});
    setFormError(null);
  };

  return (
    <Screen scroll centered keyboardAware edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Logo size={132} />
        <AppText variant="heading" align="center">Welcome back</AppText>
        <AppText variant="caption" align="center">Boarding admin - manage dogs, bookings and capacity.</AppText>
      </View>

      <View style={styles.form}>
        {!!formError && <InlineAlert message={formError} />}

        <TextInput
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          leftIcon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          leftIcon="lock-outline"
          password
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        <Button
          title="Forgot password?"
          variant="link"
          style={styles.forgot}
          onPress={() => Alert.alert('Forgot password', 'Password reset is coming soon.')}
        />

        <Button title="Log in" onPress={submit} loading={loading} fullWidth size="lg" />
      </View>

      <View style={styles.footer}>
        <AppText variant="caption">New to Paws N' Play?</AppText>
        <Button title="Create an account" variant="link" onPress={() => router.push('/register')} />
      </View>

      {USE_MOCKS && (
        <View style={styles.demo}>
          <Divider label="Admin test accounts (mock mode)" />
          <View style={styles.demoRow}>
            {DEMO_ACCOUNTS.map((a) => (
              <Button key={a.email} title={a.label} variant="outline" size="sm" onPress={() => fillDemo(a.email)} />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.xl },
  form: { gap: t.spacing.md },
  forgot: { alignSelf: 'flex-end', marginTop: -t.spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.xs, marginTop: t.spacing.lg },
  demo: { gap: t.spacing.md, marginTop: t.spacing.xl },
  demoRow: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.sm },
}));
