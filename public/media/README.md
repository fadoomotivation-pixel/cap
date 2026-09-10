# Media assets

## Source and permission

`dholera-aerial.mp4`, `dholera-aerial-poster.jpg`, `dholera-road-corridor.jpg`
and `dholera-treatment-plant.jpg` are taken from the **official Dholera SIR
audio-visual film (March 2026) produced by Dholera Industrial City Development
Limited (DICDL) / Government of Gujarat**, supplied to us by the owner.

They are used on the site to illustrate publicly-funded Dholera SIR
infrastructure and are **credited on-page to DICDL / Government of Gujarat**.
Capital Brix does not claim authorship of this footage.

**Before adding any further frames from this film, or any other DICDL material,
get written permission on file.** We have already had one intellectual-property
notice on this site (see CLAUDE.md, "The Mirrikh relationship"); the lesson
there applies to every third party, not only that one.

The clip is **8.6 seconds**, from 56.0s to 64.6s of the source film. That is
the only window in the whole 123 seconds with no titles or captions burnt into
the frame: the road and the treatment plant. It was first cut at 14 seconds,
which overran into the film's "200 Bed Multi-Specialty Hospital" card — the
caption was visible in the last four seconds of the shipped clip and in the
tail of the scroll sequence. **If this is ever re-cut, check the last frame,
not just the first.**

`seq/f01–f36.webp` are 36 frames from the same window, driven by scroll in
CinematicReveal.jsx.

## Encoding

Source: 1920×1080, 50 fps, 123 s, 25.4 MB.

### `dholera-aerial.mp4` — the 8.6 s scroll clip
1280×720, 25 fps, **0.7 MB**, no audio.

    ffmpeg -ss 56 -t 8.6 -i <source> -an -vf "scale=1280:720,fps=25" \
      -c:v libx264 -profile:v main -crf 30 -preset slow \
      -movflags +faststart -pix_fmt yuv420p dholera-aerial.mp4

### `dholera-film.mp4` — the full hero film
1280×720, 25 fps, 123 s, **12.6 MB at 814 kb/s**, no audio.

**It shipped at 375 kb/s and looked it** — visibly soft on a phone, mush around
the signage and the tree line. CRF 30 is a fine target for an 8-second clip
behind other content; it is not one for a 123-second film that is the first
thing on the homepage. Re-encoded from the 1080p source, not upscaled from the
low-bitrate file, because nothing recovers detail that was already thrown away:

    ffmpeg -i <source> -an -vf "scale=1280:720:flags=lanczos,fps=25" \
      -c:v libx264 -profile:v high -crf 29 -preset veryslow -tune film \
      -movflags +faststart -pix_fmt yuv420p dholera-film.mp4

12.6 MB is affordable **only because of the guard in `Hero.jsx`**: the video is
skipped entirely on `saveData` and on 2G/3G, carries `preload="none"`, and is
attached at idle behind a poster. Remove that guard and this file becomes a
12 MB tax on every phone visitor. If the budget ever has to come down, raise
the CRF — do not drop the resolution, since upscaling blur is the artefact
people actually notice.

`dholera-film-poster.jpg` is the frame at **58 s** — the Dholera trunk road.
Chosen because it is clean: the 40 s frame is a "Thriving ecosystem" title
slide and the 95 s architectural render carries a third-party "GAP" watermark.
Re-cut from the 1080p source; the old poster was a title-card transition
frame lifted from the low-bitrate file.

Audio is dropped on purpose: it is a background loop, and a muted video is what
lets iOS Safari autoplay it at all.
