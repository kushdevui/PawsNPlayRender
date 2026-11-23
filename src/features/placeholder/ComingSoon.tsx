import { View } from 'react-native';
import { useSession } from '@/auth/session';
import { AppText, Button, Logo, Screen } from '@/components/common';
import { makeStyles } from '@/theme';

/** Shown to roles whose app area is not built yet (customers, staff). */
export function ComingSoon({ title, message }: { title: string; message: string }) {
  const styles = useStyles();
  const signOut = useSession((s) => s.signOut);
  return (
    <Screen centered>
      <View style={styles.box}>
        <Logo size={120} />
        <AppText variant="heading" align="center">{title}</AppText>
        <AppText variant="caption" align="center">{message}</AppText>
        <Button title="Log out" variant="outline" onPress={signOut} style={styles.button} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  box: { alignItems: 'center', gap: t.spacing.md },
  button: { alignSelf: 'center', marginTop: t.spacing.md },
}));
