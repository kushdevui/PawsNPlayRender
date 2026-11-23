// Picking, "uploading" and opening attachments (vaccination cards etc.).
// All Expo modules used here work in Expo Go.
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { USE_MOCKS } from '@/api/client';
import type { DogDocument } from '@/api/types';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export interface LocalFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
}

export const isPdf = (mimeType: string) => mimeType === 'application/pdf';
export const isImage = (mimeType: string) => mimeType.startsWith('image/');

const guessMime = (name: string, fallback = 'application/octet-stream') => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : fallback;
};

const checkSize = (file: LocalFile) => {
  if (file.size && file.size > MAX_FILE_BYTES) {
    Alert.alert('File too large', `${file.name} is over 10 MB. Please choose a smaller file.`);
    return null;
  }
  return file;
};

/** Camera photo of the vaccination card. */
export async function takePhoto(): Promise<LocalFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera permission needed', 'Allow camera access in Settings to photograph documents.');
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const name = a.fileName ?? `vaccination-${Date.now()}.jpg`;
  return checkSize({ uri: a.uri, name, mimeType: a.mimeType ?? guessMime(name, 'image/jpeg'), size: a.fileSize ?? null });
}

/** Photo from the gallery. */
export async function pickFromGallery(): Promise<LocalFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const name = a.fileName ?? `vaccination-${Date.now()}.jpg`;
  return checkSize({ uri: a.uri, name, mimeType: a.mimeType ?? guessMime(name, 'image/jpeg'), size: a.fileSize ?? null });
}

/** PDF or image from Files / Drive / downloads. */
export async function pickDocument(): Promise<LocalFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: false });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return checkSize({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? guessMime(a.name), size: a.size ?? null });
}

/**
 * Turn a picked local file into a stored document.
 * Mock mode keeps the local URI (only on this device, survives until the app cache is cleared).
 * TODO(api): real mode -> multipart POST /uploads (or a pre-signed S3 URL) and store the returned URL.
 */
export async function uploadAttachment(file: LocalFile, kind: DogDocument['kind'] = 'vaccination'): Promise<DogDocument> {
  if (!USE_MOCKS) {
    // Placeholder until the backend exposes an upload endpoint.
    throw new Error('File upload is not available yet on the live server.');
  }
  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    name: file.name,
    uri: file.uri,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/** Open a PDF (or any file) in another app via the share sheet. */
export async function openExternally(doc: Pick<DogDocument, 'uri' | 'mimeType' | 'name'>) {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('Cannot open file', 'Sharing is not available on this device.');
    return;
  }
  try {
    await Sharing.shareAsync(doc.uri, { mimeType: doc.mimeType, dialogTitle: doc.name, UTI: isPdf(doc.mimeType) ? 'com.adobe.pdf' : undefined });
  } catch (e) {
    Alert.alert('Cannot open file', (e as Error).message);
  }
}

export const formatBytes = (n: number | null) =>
  n == null ? '' : n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
