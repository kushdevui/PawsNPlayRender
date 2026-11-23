import { FlatList, StyleSheet, View } from 'react-native';
import { AppText, Badge, Card, Screen, StateView } from '@/components/ui';
import { usePets } from '@/features/pets/hooks';
import { spacing } from '@/theme';
import { ageFrom } from '@/utils/format';

export default function MyPets() {
  const { data, isLoading, error, refetch, isRefetching } = usePets();

  return (
    <Screen>
      <AppText variant="title">My Pets</AppText>
      {isLoading || error || !data?.data.length ? (
        <StateView loading={isLoading} error={error} empty={!data?.data.length} emptyText="No pets yet. Add your first pet!" onRetry={refetch} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(p) => p.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <AppText variant="heading">{item.species === 'dog' ? '🐶' : '🐱'} {item.name}</AppText>
                <Badge label={item.vaccinated ? 'Vaccinated' : 'Vaccine due'} tone={item.vaccinated ? 'success' : 'warning'} />
              </View>
              <AppText variant="caption">{item.breed} · {item.gender} · {ageFrom(item.dateOfBirth)} · {item.weightKg} kg</AppText>
              {!!item.notes && <AppText variant="caption">{item.notes}</AppText>}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
