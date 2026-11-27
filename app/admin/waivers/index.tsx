// Signed boarding waivers, newest first: search by parent, dog or phone; tap for the full signed record.
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Screen, SearchBar, StateView } from '@/components/common';
import { WaiverCard } from '@/features/waivers/WaiverCard';
import { useWaivers } from '@/features/waivers/hooks';
import { makeStyles } from '@/theme';
import { plural } from '@/utils/format';

export default function AdminWaivers() {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch, isRefetching } = useWaivers({ search: search.trim() || undefined });
  const items = data?.data ?? [];
  const total = data?.meta.total ?? items.length;

  return (
    <Screen style={styles.screen} edges={['bottom']}>
      <View style={styles.header}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search parent, dog or phone" />
        {!isLoading && !error && <AppText variant="caption">{plural(total, 'signed waiver')}</AppText>}
      </View>

      {isLoading || error || items.length === 0 ? (
        <StateView
          loading={isLoading}
          error={error}
          empty={!items.length}
          emptyText={search ? 'No waivers match your search.' : 'No signed waivers yet. Share the waiver link (/waiver) with dog parents when they book.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(w) => w.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <WaiverCard item={item} onPress={() => router.push({ pathname: '/admin/waivers/[id]', params: { id: item.id } })} />
          )}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.sm },
  list: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.sm, paddingBottom: t.spacing.xxxl },
}));
