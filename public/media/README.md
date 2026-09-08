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

The clip is 14 seconds of aerial footage with no titles or captions burnt in —
segments carrying the film's own on-screen text were deliberately avoided so
our copy never sits on top of someone else's.

## Encoding

Source: 1920×1080, 50 fps, 123 s, 25.4 MB.
Shipped: 1280×720, 25 fps, 14 s, **1.1 MB**, no audio track.

A 25 MB autoplaying video would cost every phone visitor 25 MB of data and
wreck the Largest Contentful Paint that the prerendering work exists to
protect. If this clip is ever replaced, re-encode to the same budget:

    ffmpeg -ss <start> -t 14 -i <source> -an -vf "scale=1280:720,fps=25" \
      -c:v libx264 -profile:v main -crf 30 -preset slow \
      -movflags +faststart -pix_fmt yuv420p dholera-aerial.mp4

Audio is dropped on purpose: it is a background loop, and a muted video is what
lets iOS Safari autoplay it at all.
