import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PickerField } from './PickerField';
import { SearchBar } from './SearchBar';
import { Sheet } from './Sheet';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  description?: string;
}

interface Props<V extends string> {
  label: string;
  value: V | null;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  searchable?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  emptyText?: string;
}

/** Dropdown-style field: tap -> searchable list in a sheet. */
export function SelectField<V extends string>({
  label, value, options, onChange, searchable = false, placeholder = 'Select', error, helperText, disabled, emptyText = 'No options',
}: Props<V>) {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q ? options : options.filter((o) => `${o.label} ${o.description ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PickerField
        label={label}
        displayValue={selected?.label ?? ''}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        error={error}
        helperText={helperText}
        disabled={disabled}
      />
      <Sheet visible={open} onDismiss={close} title={label} scrollable={false}>
        {searchable && <SearchBar value={query} onChangeText={setQuery} placeholder={`Search ${label.toLowerCase()}`} style={styles.search} />}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<AppText variant="caption" align="center" style={styles.empty}>{emptyText}</AppText>}
          renderItem={({ item }) => {
            const isSelected = item.value === value;
            return (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  close();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.colors.surfaceMuted }]}
              >
                <View style={styles.optionText}>
                  <AppText variant="bodyStrong">{item.label}</AppText>
                  {!!item.description && <AppText variant="caption">{item.description}</AppText>}
                </View>
                {isSelected && <Icon name="check" color="text" />}
              </Pressable>
            );
          }}
        />
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  search: { marginBottom: t.spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.radius.md,
    minHeight: t.sizes.controlMd,
  },
  optionText: { flex: 1, gap: t.spacing.xxs },
  empty: { padding: t.spacing.xl },
}));
