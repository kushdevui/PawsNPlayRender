// User home: greeting + available services.
import { FlatList, View } from 'react-native';
import { useSession } from '@/auth/session';
import { AppText, Card, Screen, StateView } from '@/components/common';
import { useServices } from '@/features/services/hooks';
import { makeStyles } from '@/theme';
import { formatDuration, formatPrice } from '@/utils/format';

export default function UserHome() {
  const styles = useStyles();
  const name = useSession((s) => s.user?.name.split(' ')[0]);
  const { data, isLoading, error, refetch, isRefetching } = useServices();

  return (
    <Screen>
      <View>
        <AppText variant="heading">Hi {name}</AppText>
        <AppText variant="caption">What does your pet need today?</AppText>
      </View>
      {isLoading || error || !data?.data.length ? (
        <StateView loading={isLoading} error={error} empty={!data?.data.length} emptyText="No services available right now." onRetry={refetch} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(s) => s.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <AppText variant="subheading">{item.name}</AppText>
                <AppText variant="bodyStrong">{formatPrice(item.price, item.currency)}</AppText>
              </View>
              <AppText variant="caption">{item.description}</AppText>
              <AppText variant="caption">{formatDuration(item.durationMinutes)} · {item.speciesAllowed.join(', ')}</AppText>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.md, paddingBottom: t.spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
