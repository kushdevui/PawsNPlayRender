// All dogs: search by dog/owner/phone, active vs archived.
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Chip, Fab, Screen, SearchBar, StateView } from '@/components/common';
import { DogCard } from '@/features/dogs/DogCard';
import { useDogs } from '@/features/dogs/hooks';
import { makeStyles } from '@/theme';
import { plural } from '@/utils/format';

export default function AdminDogs() {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const { data, isLoading, error, refetch, isRefetching } = useDogs({ search: search.trim() || undefined, status });
  const dogs = data?.data ?? [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="heading">Dogs</AppText>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search dog, breed, owner or phone" />
        <View style={styles.chips}>
          <Chip label="Active" selected={status === 'active'} onPress={() => setStatus('active')} />
          <Chip label="Archived" selected={status === 'archived'} onPress={() => setStatus('archived')} />
        </View>
        {!isLoading && !error && <AppText variant="caption">{plural(dogs.length, 'dog')}</AppText>}
      </View>

      {isLoading || error || dogs.length === 0 ? (
        <StateView
          loading={isLoading}
          error={error}
          empty={!dogs.length}
          emptyText={search ? 'No dogs match your search.' : status === 'active' ? 'No dogs yet. Add your first dog.' : 'No archived dogs.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={dogs}
          keyExtractor={(d) => d.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <DogCard dog={item} onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: item.id } })} />}
        />
      )}

      <Fab label="Add dog" onPress={() => router.push('/admin/dog/new')} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.sm },
  chips: { flexDirection: 'row', gap: t.spacing.sm },
  list: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.sm, paddingBottom: 96 },
}));
