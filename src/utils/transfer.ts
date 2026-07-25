// Lets React paint a progress modal before heavy sync work (xlsx build, etc.).
export function yieldToUI(ms = 40): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Turns unknown thrown values into a short, user-facing reason.
export function describeTransferError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();

    if (/cancel|dismiss|user did not share/i.test(message)) {
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

  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}
