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
