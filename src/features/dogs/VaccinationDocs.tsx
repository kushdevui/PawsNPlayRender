// Vaccination records for a dog: add (camera / gallery / PDF), view, remove.
import { useState } from 'react';
import { Alert, View } from 'react-native';
import type { DogDocument } from '@/api/types';
import { AppText, AttachmentList, Button } from '@/components/common';
import { formatBytes, openExternally, pickDocument, pickFromGallery, takePhoto, uploadAttachment, type LocalFile } from '@/lib/attachments';
import { makeStyles } from '@/theme';
import { formatDateLong } from '@/utils/date';

interface Props {
  documents: DogDocument[];
  /** Omit for read-only (e.g. dog profile view). */
  onChange?: (documents: DogDocument[]) => void;
}

const MAX_DOCS = 10;

export function VaccinationDocs({ documents, onChange }: Props) {
  const styles = useStyles();
  const [busy, setBusy] = useState(false);
  const editable = !!onChange;
  const docs = documents.filter((d) => d.kind === 'vaccination');

  const add = async (pick: () => Promise<LocalFile | null>) => {
    if (!onChange) return;
    if (documents.length >= MAX_DOCS) return Alert.alert('Limit reached', `Up to ${MAX_DOCS} documents per dog.`);
    try {
      setBusy(true);
      const file = await pick();
      if (!file) return;
      const doc = await uploadAttachment(file, 'vaccination');
      onChange([...documents, doc]);
    } catch (e) {
      Alert.alert('Could not add file', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) =>
    Alert.alert('Remove document?', 'It will be removed when you save the dog.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onChange?.(documents.filter((d) => d.id !== id)) },
    ]);

  return (
    <View style={styles.wrap}>
      <AttachmentList
        items={docs.map((d) => ({ ...d, meta: [formatBytes(d.size), formatDateLong(d.uploadedAt)].filter(Boolean).join(' · ') }))}
        onOpenFile={(item) => openExternally(item)}
        onRemove={editable ? (item) => remove(item.id) : undefined}
        emptyText={editable ? undefined : 'No vaccination records uploaded.'}
      />
      {editable && (
        <>
          <AppText variant="caption">Add a photo or PDF of the vaccination card (max 10 MB each).</AppText>
          <View style={styles.actions}>
            <Button title="Camera" icon="camera-outline" variant="outline" size="sm" onPress={() => add(takePhoto)} disabled={busy} />
            <Button title="Gallery" icon="image-outline" variant="outline" size="sm" onPress={() => add(pickFromGallery)} disabled={busy} />
            <Button title="PDF / file" icon="file-upload-outline" variant="outline" size="sm" onPress={() => add(pickDocument)} disabled={busy} />
          </View>
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
