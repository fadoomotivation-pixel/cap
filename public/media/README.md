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
Shipped: 1280×720, 25 fps, 8.6 s, **0.7 MB**, no audio track.

A 25 MB autoplaying video would cost every phone visitor 25 MB of data and
wreck the Largest Contentful Paint that the prerendering work exists to
protect. If this clip is ever replaced, re-encode to the same budget:

    ffmpeg -ss 56 -t 8.6 -i <source> -an -vf "scale=1280:720,fps=25" \
      -c:v libx264 -profile:v main -crf 30 -preset slow \
      -movflags +faststart -pix_fmt yuv420p dholera-aerial.mp4

Audio is dropped on purpose: it is a background loop, and a muted video is what
lets iOS Safari autoplay it at all.
