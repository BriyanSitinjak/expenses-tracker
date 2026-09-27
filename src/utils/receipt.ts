import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ReceiptPickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'permission' | 'unavailable' | 'failed'; message?: string };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.75,
};

// Ensures camera permission is granted before launching the camera.
async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

// Ensures photo-library permission is granted before opening the gallery.
async function ensureLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

// Copies a picked image into app document storage so the URI survives restarts.
async function persistReceiptUri(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') return sourceUri;

  const FileSystem = await import('expo-file-system/legacy');
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) return sourceUri;

  const receiptsDir = `${directory}receipts/`;
  const info = await FileSystem.getInfoAsync(receiptsDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
  }

  const extMatch = sourceUri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch?.[1]?.toLowerCase() ?? 'jpg';
  const dest = `${receiptsDir}receipt-${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

async function fromPickerResult(
  result: ImagePicker.ImagePickerResult
): Promise<ReceiptPickResult> {
  if (result.canceled || !result.assets?.[0]?.uri) {
    return { ok: false, reason: 'cancelled' };
  }

  try {
    const uri = await persistReceiptUri(result.assets[0].uri);
    return { ok: true, uri };
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

// Opens the device camera to capture a receipt photo.
export async function takeReceiptPhoto(): Promise<ReceiptPickResult> {
  if (Platform.OS === 'web') {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Camera capture is not available on web. Use Choose photo instead.',
    };
  }

  const granted = await ensureCameraPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission',
      message: 'Camera permission is required to photograph a receipt.',
    };
  }

  try {
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    return fromPickerResult(result);
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

// Opens the photo library to pick an existing receipt image.
export async function pickReceiptFromLibrary(): Promise<ReceiptPickResult> {
  const granted = await ensureLibraryPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission',
      message: 'Photo library permission is required to attach a receipt.',
    };
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    return fromPickerResult(result);
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}
