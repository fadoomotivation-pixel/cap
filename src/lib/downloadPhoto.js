/**
 * HR makes a birthday post from the employee's KYC photo. The directory showed
 * the photo but offered no way to get it: right-click / long-press saves it as
 * a Supabase storage id like "8d182c0e_photo_1757…jpg", which is useless in a
 * folder of twenty. A plain <a download> does not help either — the file is on
 * a different origin, so the browser ignores the attribute and just navigates.
 *
 * Fetching the blob and saving it under the person's own name is what actually
 * produces "Tanu Goel.jpg" in Downloads.
 */
export async function downloadPhoto(url, personName) {
  if (!url) throw new Error('No photo on this record.');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch the photo (${res.status}).`);
  const blob = await res.blob();

  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const safe = (personName || 'employee').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `${safe}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the save in Safari; one tick is enough.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Photos one after another, so a birthday batch is one action, not ten. */
export async function downloadPhotos(people) {
  const failed = [];
  for (const p of people) {
    try {
      await downloadPhoto(p.photo_url, p.full_name);
      // Browsers throttle or block a burst of saves; a short gap avoids it.
      await new Promise((r) => setTimeout(r, 400));
    } catch {
      failed.push(p.full_name);
    }
  }
  return failed;
}
