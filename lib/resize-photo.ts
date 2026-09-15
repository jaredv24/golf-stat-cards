/**
 * Downscales and re-encodes a photo client-side before upload. Phone photos
 * routinely run 3-8MB, which is slow to upload on course wifi and risks
 * hitting serverless request-body limits — a ~1280px JPEG is plenty for an
 * 8-bit stylization and comes out a few hundred KB.
 */
export async function resizePhotoForUpload(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<File> {
  if (typeof createImageBitmap === "undefined") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) return file;

  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
