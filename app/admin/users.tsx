import { useState } from 'react';
import { FlatList, View } from 'react-native';
import type { Role } from '@/api/types';
import { roleLabel } from '@/auth/roles';
import { AppText, Badge, Button, Card, Screen, StateView } from '@/components/common';
import { useUsers } from '@/features/admin/hooks';
import { makeStyles } from '@/theme';

const FILTERS: Array<{ label: string; role?: Role }> = [
  { label: 'All' },
  { label: 'Users', role: 'user' },
  { label: 'Staff', role: 'staff' },
  { label: 'Admins', role: 'admin' },
];

export default function AdminUsers() {
  const styles = useStyles();
  const [role, setRole] = useState<Role | undefined>();
  const { data, isLoading, error, refetch, isRefetching } = useUsers(role ? { role } : undefined);

  return (
    <Screen>
      <AppText variant="heading">Users</AppText>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Button key={f.label} size="sm" title={f.label} variant={role === f.role ? 'secondary' : 'outline'} onPress={() => setRole(f.role)} />
        ))}
      </View>
      {isLoading || error || !data?.data.length ? (
        <StateView loading={isLoading} error={error} empty={!data?.data.length} emptyText="No users found." onRetry={refetch} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(u) => u.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <AppText variant="subheading">{item.name}</AppText>
                <Badge label={roleLabel[item.role]} tone="brand" />
              </View>
              <AppText variant="caption">{item.email}</AppText>
              {item.status === 'inactive' && <Badge label="Inactive" tone="danger" />}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  filters: { flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' },
  list: { gap: t.spacing.md, paddingBottom: t.spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
