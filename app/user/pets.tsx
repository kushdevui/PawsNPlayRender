import { FlatList, View } from 'react-native';
import { AppText, Badge, Card, Icon, Screen, StateView } from '@/components/common';
import { usePets } from '@/features/pets/hooks';
import { makeStyles } from '@/theme';
import { ageFrom } from '@/utils/format';

export default function MyPets() {
  const styles = useStyles();
  const { data, isLoading, error, refetch, isRefetching } = usePets();

  return (
    <Screen>
      <AppText variant="heading">My Pets</AppText>
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
                <View style={styles.name}>
                  <Icon name={item.species === 'dog' ? 'dog' : 'cat'} />
                  <AppText variant="subheading">{item.name}</AppText>
                </View>
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

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.md, paddingBottom: t.spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
}));
