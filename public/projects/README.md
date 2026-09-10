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

## Permission (10 September 2026)

Mirrikh Infratech has given permission for their project images to be used on
this website. The six photographs withdrawn under their notice of 8 September
2026 are restored and live again.

`mayur-park-iii.webp` stays disabled, and permission does not change that: the
file supplied for that slug carries the **MAYUR PARK-II** brand mark, not Park
III. It is the wrong picture, not an unlicensed one. Ask Mirrikh for the
correct Park III image, save it as `mayur-park-iii.webp`, and uncomment the
`image:` line for that project in `src/data/site.js`.

The permission on record covers Mirrikh's **project images**. It is not a
blanket licence for any other third party's material, and it does not cover
Mirrikh's corporate history, vision, mission or timeline — those stay off
`/about` per their notice.
