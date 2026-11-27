// Vaccination / deworming records for the Know Your Dog form: picked locally, sent with the form (not uploaded on pick).
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { AppText, AttachmentList, Button } from '@/components/common';
import { formatBytes, isImage, isPdf, openExternally, pickDocument, pickFromGallery, takePhoto, type LocalFile } from '@/lib/attachments';
import { makeStyles } from '@/theme';
import { MAX_FILES, kydText } from './kydData';
import { FieldLabel } from './KydFields';

interface Props {
  label: string;
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
  disabled?: boolean;
}

// The server accepts image/* (not SVG) and PDF. Size (10 MB) is checked by the picker helpers.
const acceptable = (f: LocalFile) => isPdf(f.mimeType) || (isImage(f.mimeType) && f.mimeType !== 'image/svg+xml');

export function KydDocuments({ label, files, onChange, disabled }: Props) {
  const styles = useStyles();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const full = files.length >= MAX_FILES;

  const add = async (pick: () => Promise<LocalFile | null>) => {
    if (full) return setError(`You can add up to ${MAX_FILES} files.`);
    setError('');
    try {
      setBusy(true);
      const file = await pick();
      if (!file) return;
      if (!acceptable(file)) return setError(`${file.name} is not a photo or PDF.`);
      onChange([...files, file]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <FieldLabel label={label} hint={kydText.documentsHint} />
      <AttachmentList
        items={files.map((f, i) => ({ id: `${i}-${f.uri}`, name: f.name, uri: f.uri, mimeType: f.mimeType, meta: formatBytes(f.size) }))}
        onOpenFile={(item) => openExternally(item)}
        onRemove={(item) => {
          setError('');
          onChange(files.filter((f, i) => `${i}-${f.uri}` !== item.id));
        }}
      />
      <AppText variant="caption">{kydText.documentsAdd}</AppText>
      <View style={styles.actions}>
        {/* The browser's file picker already offers the camera on phones. */}
        {Platform.OS !== 'web' && (
          <Button title="Camera" icon="camera-outline" variant="outline" size="sm" onPress={() => add(takePhoto)} disabled={busy || disabled || full} />
        )}
        <Button title="Photo" icon="image-outline" variant="outline" size="sm" onPress={() => add(pickFromGallery)} disabled={busy || disabled || full} />
        <Button title="PDF / file" icon="file-upload-outline" variant="outline" size="sm" onPress={() => add(pickDocument)} disabled={busy || disabled || full} />
      </View>
      {!!error && <AppText variant="label" color="danger">{error}</AppText>}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
