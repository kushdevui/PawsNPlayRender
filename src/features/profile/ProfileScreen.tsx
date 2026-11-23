// Shared profile screen used by every role's "Profile" tab.
import { StyleSheet, View } from 'react-native';
import { useSession } from '@/auth/session';
import { roleLabel } from '@/auth/roles';
import { AppText, Badge, Button, Card, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export function ProfileScreen() {
  const { user, signOut } = useSession();
  if (!user) return null;
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText style={styles.initials}>{initials}</AppText>
        </View>
        <AppText variant="title">{user.name}</AppText>
        <Badge label={roleLabel[user.role]} tone="info" />
      </View>
      <Card>
        <AppText variant="caption">Email</AppText>
        <AppText>{user.email}</AppText>
        <AppText variant="caption" style={styles.gap}>Phone</AppText>
        <AppText>{user.phone ?? '-'}</AppText>
      </Card>
      <Button title="Log out" variant="danger" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: radius.pill, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700', color: colors.primaryDark },
  gap: { marginTop: spacing.sm },
});
