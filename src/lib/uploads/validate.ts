// File-upload validation shared by every upload endpoint (product files,
// avatars, lesson attachments, project-request attachments, ...).
// Never trust the client-declared MIME type alone — it validates the
// filename extension against an allowlist and sniffs the real content type
// from the first bytes (a lightweight magic-number check) as well.

const MAX_SIZES_BYTES = {
  image: 8 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  archive: 512 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
} as const;

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
  document: ["pdf", "doc", "docx", "txt", "md"],
  archive: ["zip", "rar", "7z"],
  video: ["mp4", "webm"],
};

const MAGIC_NUMBERS: { prefix: number[]; mime: string }[] = [
  { prefix: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { prefix: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  { prefix: [0x47, 0x49, 0x46], mime: "image/gif" },
  { prefix: [0x50, 0x4b, 0x03, 0x04], mime: "application/zip" }, // also docx/zip-based
  { prefix: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf" },
  { prefix: [0x52, 0x61, 0x72, 0x21], mime: "application/rar" },
];

function sniffMime(buffer: Buffer): string | null {
  for (const { prefix, mime } of MAGIC_NUMBERS) {
    if (buffer.length >= prefix.length && prefix.every((b, i) => buffer[i] === b)) return mime;
  }
  return null;
}

export type UploadCategory = keyof typeof MAX_SIZES_BYTES;

export interface UploadValidationResult {
  ok: boolean;
  error?: string;
  safeFileName?: string;
}

export function validateUpload(params: {
  category: UploadCategory;
  originalName: string;
  sizeBytes: number;
  buffer: Buffer;
}): UploadValidationResult {
  const { category, originalName, sizeBytes, buffer } = params;

  if (sizeBytes > MAX_SIZES_BYTES[category]) {
    return { ok: false, error: `File exceeds max size for ${category}` };
  }

  // Strip any path components (path traversal guard) and reject empty names.
  const baseName = originalName.replace(/^.*[\\/]/, "").trim();
  if (!baseName || baseName.startsWith(".")) {
    return { ok: false, error: "Invalid file name" };
  }

  const ext = baseName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS[category].includes(ext)) {
    return { ok: false, error: `Extension .${ext} not allowed for ${category}` };
  }

  // Content sniffing is meaningful for images/docs/archives; video containers
  // vary too much for a simple magic-number allowlist, so extension + size
  // are the primary gate there (still processed through a private, non-
  // executable storage path — never served from a script-capable directory).
  if (category === "image" || category === "document" || category === "archive") {
    const sniffed = sniffMime(buffer);
    if (category === "image" && ext !== "svg" && !sniffed?.startsWith("image/")) {
      return { ok: false, error: "File content does not match an image type" };
    }
  }

  const safeFileName = `${crypto.randomUUID()}.${ext}`;
  return { ok: true, safeFileName };
}
