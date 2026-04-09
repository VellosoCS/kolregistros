const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogg"];

export function isVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));
  }
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function isMediaFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function getFilesFromClipboard(e: ClipboardEvent | React.ClipboardEvent): File[] {
  const files: File[] = [];
  const items = e.clipboardData?.items;
  if (!items) return files;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file" && (item.type.startsWith("image/") || item.type.startsWith("video/"))) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  return files;
}
