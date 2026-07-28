import { Platform } from 'react-native';

export type ExportResult = {
  fileUri?: string;
  shared: boolean;
  /** True when the file was saved but the user closed the share sheet. */
  dismissed?: boolean;
};

export type TransferProgressUpdate = {
  message: string;
  step: number;
  totalSteps: number;
};

export type TransferProgress = (update: TransferProgressUpdate) => void;

export type TransferStatus = {
  title: string;
  message: string;
  step?: number;
  totalSteps?: number;
} | null;

export type ShareFileOptions = {
  mimeType: string;
  dialogTitle: string;
  UTI?: string;
};

type NativeFsModules = {
  FileSystem: typeof import('expo-file-system/legacy');
  Sharing: typeof import('expo-sharing');
};

let nativeFsPromise: Promise<NativeFsModules> | null = null;

async function getNativeFsModules(): Promise<NativeFsModules> {
  if (!nativeFsPromise) {
    nativeFsPromise = Promise.all([
      import('expo-file-system/legacy'),
      import('expo-sharing'),
    ]).then(([FileSystem, Sharing]) => ({ FileSystem, Sharing }));
  }
  return nativeFsPromise;
}

// Warm the dynamic imports so the first transfer does not wait on module load.
export function preloadTransferModules(): void {
  void getNativeFsModules();
}

// Lets React paint a progress modal before heavy sync work.
export function yieldToUI(ms = 16): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reports a step and yields so the modal can re-render before the next heavy chunk.
export async function reportTransferProgress(
  onProgress: TransferProgress | undefined,
  update: TransferProgressUpdate
): Promise<void> {
  onProgress?.(update);
  await yieldToUI(24);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return '';
}

function isShareDismissed(error: unknown): boolean {
  return /cancel|dismiss|user did not share|sharing was (cancelled|canceled)/i.test(
    errorMessage(error)
  );
}

// Shared text-file reader for import/export (web + native).
export async function readTextFile(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.text();
  }
  const { FileSystem } = await getNativeFsModules();
  return FileSystem.readAsStringAsync(uri);
}

// Shared base64 reader used when importing Excel on native.
export async function readBase64File(uri: string): Promise<string> {
  const { FileSystem } = await getNativeFsModules();
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

// Resolves a writable app directory for export files.
export async function resolveExportDirectory(): Promise<string> {
  const { FileSystem } = await getNativeFsModules();
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('No writable directory available on this device.');
  }
  return directory;
}

// Writes text or base64 contents to a local file (replaces any existing file).
export async function writeExportFile(
  fileUri: string,
  contents: string,
  encoding: 'utf8' | 'base64'
): Promise<void> {
  const { FileSystem } = await getNativeFsModules();

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch {
    // Ignore cleanup errors and attempt a fresh write.
  }

  await FileSystem.writeAsStringAsync(fileUri, contents, { encoding });
}

// Presents the system share sheet. Dismiss/cancel is not treated as a hard failure.
export async function shareExportFile(
  fileUri: string,
  options: ShareFileOptions
): Promise<'shared' | 'unavailable' | 'dismissed'> {
  const { Sharing } = await getNativeFsModules();
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return 'unavailable';

  try {
    await Sharing.shareAsync(fileUri, options);
    return 'shared';
  } catch (error) {
    if (isShareDismissed(error)) return 'dismissed';
    throw error;
  }
}

// Turns unknown thrown values into a short, user-facing reason.
export function describeTransferError(error: unknown, fallback: string): string {
  const message = errorMessage(error);
  if (!message) return fallback;

  if (isShareDismissed(error)) {
    return 'You closed the share sheet before the file was shared. The export was cancelled.';
  }
  if (/permission|access/i.test(message)) {
    return `Permission issue: ${message}`;
  }
  if (/network|internet|offline/i.test(message)) {
    return `Network issue: ${message}`;
  }
  if (/No writable directory/i.test(message)) {
    return 'This device has no writable folder for saving the export file.';
  }
  if (/out of memory|ENOMEM|allocation/i.test(message)) {
    return 'The file was too large for this device to process. Try exporting fewer transactions.';
  }

  return message;
}
