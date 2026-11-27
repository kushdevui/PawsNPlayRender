// "Know Your Dog" submissions from dog parents: search, status filter, tap for the full answers.
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Chip, Screen, SearchBar, StateView } from '@/components/common';
import { QuestionnaireCard } from '@/features/questionnaires/QuestionnaireCard';
import { useQuestionnaires } from '@/features/questionnaires/hooks';
import { QUESTIONNAIRE_STATUS_FILTERS, type QuestionnaireStatusFilter } from '@/features/questionnaires/status';
import { makeStyles } from '@/theme';
import { plural } from '@/utils/format';

const EMPTY_TEXT: Record<QuestionnaireStatusFilter, string> = {
  new: 'No new forms. You are all caught up.',
  reviewed: 'No reviewed forms.',
  archived: 'No archived forms.',
  all: 'No forms yet. Share the Know Your Dog link with dog parents when they book.',
};

export default function AdminForms() {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuestionnaireStatusFilter>('new');
  const { data, isLoading, error, refetch, isRefetching } = useQuestionnaires({
    search: search.trim() || undefined,
    status: status === 'all' ? undefined : status,
  });
  const items = data?.data ?? [];
  const total = data?.meta.total ?? items.length;

  return (
    <Screen style={styles.screen} edges={['bottom']}>
      <View style={styles.header}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search dog, owner or phone" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {QUESTIONNAIRE_STATUS_FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} selected={status === f.value} onPress={() => setStatus(f.value)} />
          ))}
        </ScrollView>
        {!isLoading && !error && <AppText variant="caption">{plural(total, 'form')}</AppText>}
      </View>

      {isLoading || error || items.length === 0 ? (
        <StateView
          loading={isLoading}
          error={error}
          empty={!items.length}
          emptyText={search ? 'No forms match your search.' : EMPTY_TEXT[status]}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(q) => q.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <QuestionnaireCard item={item} onPress={() => router.push({ pathname: '/admin/forms/[id]', params: { id: item.id } })} />
          )}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.sm },
  chips: { gap: t.spacing.sm, paddingVertical: t.spacing.xs },
  list: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.sm, paddingBottom: t.spacing.xxxl },
}));
