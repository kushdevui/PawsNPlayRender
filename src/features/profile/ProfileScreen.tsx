// Shared profile screen used by every role's "Profile" tab.
import { View } from 'react-native';
import { router } from 'expo-router';
import { usePermission } from '@/auth/permissions';
import { useSession } from '@/auth/session';
import { roleLabel } from '@/auth/roles';
import { AppText, Avatar, Badge, Button, Card, Screen } from '@/components/common';
import { makeStyles } from '@/theme';

export function ProfileScreen() {
  const styles = useStyles();
  const { user, signOut } = useSession();
  const can = usePermission();
  if (!user) return null;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={user.name} imageUrl={user.avatarUrl} size={80} />
        <AppText variant="heading">{user.name}</AppText>
        <Badge label={roleLabel[user.role]} tone="brand" />
      </View>
      <Card>
        <AppText variant="caption">Email</AppText>
        <AppText>{user.email}</AppText>
        <AppText variant="caption" style={styles.gap}>Phone</AppText>
        <AppText>{user.phone ?? '-'}</AppText>
      </Card>
      {can('settings.manage') && (
        <Button title="Boarding settings" icon="cog-outline" variant="outline" fullWidth onPress={() => router.push('/admin/settings')} />
      )}
      <Button title="Log out" variant="danger" icon="logout" fullWidth onPress={signOut} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.lg },
  gap: { marginTop: t.spacing.sm },
}));
