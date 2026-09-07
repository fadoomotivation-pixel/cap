/**
 * Photos taken on a phone are 3–5 MB. They were uploaded at full size over
 * whatever mobile signal the employee had, which is what produced Safari's
 * "TypeError: Load failed" — its message for a fetch that died mid-flight.
 * An ID-card photo is displayed at a couple of hundred pixels, so the size was
 * buying nothing and costing the upload.
 *
 * Re-encoding through a canvas also fixes a second bug: the upload hardcoded
 * contentType 'image/jpeg' whatever the file actually was, so an iPhone HEIC or
 * a PNG was stored under a type it is not.
 */
export async function compressImage(file, maxPx = 1000, quality = 0.85) {
  // Not an image (a PDF of a document) — nothing to do.
  if (!file || !file.type?.startsWith('image/')) return file;

  const bitmap = await loadBitmap(file);
  if (!bitmap) return file; // Undecodable: send the original rather than nothing.

  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  // Only keep the re-encode if it actually helped — a small photo can grow.
  return blob && blob.size < file.size ? blob : file;
}

function loadBitmap(file) {
  // createImageBitmap is the fast path; Safari needs the <img> fallback for HEIC.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
