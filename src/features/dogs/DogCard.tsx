import { View } from 'react-native';
import type { Dog } from '@/api/types';
import { AppText, Avatar, Badge, Card } from '@/components/common';
import { makeStyles } from '@/theme';
import { ageFrom } from '@/utils/format';
import { temperamentLabel, temperamentTone } from './options';

/** One dog in a list. */
export function DogCard({ dog, onPress }: { dog: Dog; onPress?: () => void }) {
  const styles = useStyles();
  const vaccineExpired = !!dog.vaccinationExpiry && dog.vaccinationExpiry < new Date().toISOString().slice(0, 10);
  return (
    <Card onPress={onPress} accessibilityLabel={dog.name}>
      <View style={styles.row}>
        <Avatar name={dog.name} imageUrl={dog.photoUrl} size={44} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText variant="subheading" numberOfLines={1} style={styles.shrink}>{dog.name}</AppText>
            {dog.status === 'archived' && <Badge label="Archived" />}
          </View>
          <AppText variant="caption" numberOfLines={1}>
            {[dog.breed, dog.gender === 'male' ? 'Male' : 'Female', ageFrom(dog.dateOfBirth)].filter(Boolean).join(' · ')}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>{dog.ownerName} · {dog.ownerPhone}</AppText>
          <View style={styles.badges}>
            <Badge label={temperamentLabel[dog.temperament]} tone={temperamentTone[dog.temperament]} />
            {!dog.vaccinated || vaccineExpired ? (
              <Badge label={vaccineExpired ? 'Vaccine expired' : 'Not vaccinated'} tone="danger" />
            ) : (
              <Badge label="Vaccinated" tone="success" />
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
  body: { flex: 1, gap: t.spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  shrink: { flexShrink: 1 },
  badges: { flexDirection: 'row', gap: t.spacing.xs, marginTop: t.spacing.xs, flexWrap: 'wrap' },
}));
