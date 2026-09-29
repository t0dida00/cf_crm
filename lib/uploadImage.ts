import { t } from "@/lib/i18n";
/** Matches the backend's limit (`MAX_IMAGE_BYTES`). */
/** Matches the backend. Under Vercel's 4.5 MB request limit, so an upload never fails there. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Uploads an image through /api/upload to the business's own storage (or the
 * shared one) and returns its public URL. The business must already exist.
 * Throws with a message fit to show.
 */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error(t("errors.imageTooBig"));
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": file.type, "X-Filename": file.name },
    body: file,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || t("errors.uploadFailed"));
  }
  const { url } = await res.json();
  return url;
}
