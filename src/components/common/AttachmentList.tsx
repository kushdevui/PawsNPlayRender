import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

export interface AttachmentItem {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  /** Secondary text, e.g. "240 KB · 23 Nov". */
  meta?: string;
}

interface Props {
  items: AttachmentItem[];
  /** Called for non-images (PDFs) - e.g. open in another app. Images open in a built-in viewer. */
  onOpenFile: (item: AttachmentItem) => void;
  onRemove?: (item: AttachmentItem) => void;
  emptyText?: string;
}

/** List of attached files with thumbnails; tap to view, optional remove. */
export function AttachmentList({ items, onOpenFile, onRemove, emptyText }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [viewing, setViewing] = useState<AttachmentItem | null>(null);

  if (items.length === 0) return emptyText ? <AppText variant="caption">{emptyText}</AppText> : null;

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const image = item.mimeType.startsWith('image/');
        return (
          <View key={item.id} style={styles.row}>
            <Pressable
              onPress={() => (image ? setViewing(item) : onOpenFile(item))}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}`}
              style={({ pressed }) => [styles.open, pressed && { opacity: 0.7 }]}
            >
              {image ? (
                <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.fileThumb]}>
                  <Icon name="file-pdf-box" color="danger" size={28} />
                </View>
              )}
              <View style={styles.text}>
                <AppText variant="bodyStrong" numberOfLines={1}>{item.name}</AppText>
                {!!item.meta && <AppText variant="caption" numberOfLines={1}>{item.meta}</AppText>}
              </View>
            </Pressable>
            {onRemove && (
              <IconButton icon="close" size={18} iconColor={theme.colors.textMuted} onPress={() => onRemove(item)} accessibilityLabel={`Remove ${item.name}`} />
            )}
          </View>
        );
      })}

      <Sheet visible={!!viewing} onDismiss={() => setViewing(null)} title={viewing?.name}>
        {viewing && <Image source={{ uri: viewing.uri }} style={styles.full} resizeMode="contain" />}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: t.sizes.borderWidth, borderColor: t.colors.border, borderRadius: t.radius.md, paddingLeft: t.spacing.sm },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.sm },
  thumb: { width: 48, height: 48, borderRadius: t.radius.sm, backgroundColor: t.colors.surfaceMuted },
  fileThumb: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: t.spacing.xxs },
  full: { width: '100%', aspectRatio: 0.75, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceMuted },
}));
