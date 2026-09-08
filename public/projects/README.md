# Project photographs

Drop project photos here as `<project-slug>.webp` — the slug is the project name
lowercased with spaces replaced by hyphens, matching the `/projects/<slug>` URL.
For example: `mayur-nova.webp`, `mayur-aerocity-ii.webp`.

Then add `image: '/projects/mayur-nova.webp'` to that project in
`src/data/site.js`. The card picks it up automatically; without it the card
falls back to generated SVG art.

**These must be files we host.** Do not point `image` at a URL on another
company's server — it breaks the moment they rename a folder, it uses their
bandwidth, and it tells a crawler the content is theirs, not ours.

Aim for roughly 1600×1200 (4:3), WebP, under ~200 KB each.

## Why this folder is empty (8 September 2026)

It previously held seven photographs taken from mirrikh.com. Mirrikh Infratech's
notice of that date requires the removal of any of their photographs,
trademarks, logos or other material that Capital Brix is not authorised to use,
so the files were deleted and the `image:` lines in `site.js` commented out.
The cards fall back to generated art, which is why nothing looks broken.

**Hosting them here does not make them ours.** Do not restore them from git
history. Put a photo back only when it is one of these:

- a photograph Capital Brix took, or paid to have taken; or
- a file Mirrikh Infratech has supplied to us in writing for website use.

Ask for the written permission before the file goes back in the folder, and note
which project it covers. Re-enabling is then one edit: uncomment the `image:`
line for that project.
