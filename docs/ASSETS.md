# Art and fonts

## Studio artwork

The Continuum, Open Assembly, Discrete Matter, and Signal Weave sculptures were
authored for this AppCubic website. They are new geometry, not reused artwork
from App Automaton or the RenoCrypt field guide.

- `scripts/render-kinetic.py`: the continuous folded ribbon and its 240-frame loop.
- `scripts/render-studies.py`: the three supporting studies.
- `src/assets/art/`: compressed posters, illustrations, and the two theme variants
  of the loop. Astro fingerprints the published files.
- `public/assets/imgs/studio-continuum.png`: the 1200 by 630 sharing card. The old
  `og-image.png` address remains available with the same new card.

The renders use [Studio Small 09](https://polyhaven.com/a/studio_small_09), an
HDRI lighting environment by Sergej Majboroda, published by Poly Haven under
CC0. The environment is an offline authoring input and is not downloaded by
site visitors.

Optional authoring, with an independently downloaded environment:

```sh
blender --background --factory-startup --python scripts/render-kinetic.py -- /path/to/output /path/to/studio_small_09_1k.hdr loop
blender --background --factory-startup --python scripts/render-studies.py -- /path/to/output /path/to/studio_small_09_1k.hdr
```

Posters use WebP. The motion assets use H.264 MP4 at 720 by 720 and 24 frames per
second, composited onto the two exact theme backgrounds. They have no audio.
The runtime requests only the active theme. The poster is the complete fallback.

## Fonts

The original self-hosted [Boska](https://www.fontshare.com/fonts/boska) and
[General Sans](https://www.fontshare.com/fonts/general-sans) families are retained.
They come from the Indian Type Foundry through Fontshare and are distributed
under the ITF Free Font License. Official distribution notices are preserved in
`public/fonts/boska-LICENSE.txt` and `public/fonts/general-sans-LICENSE.txt`.
The fonts are used without modification. No Google Fonts service is used.

## Brand mark

The three-plane AppCubic mark retains the existing site's cubic silhouette.
Its SVG geometry is included in the initial HTML, with an enamel-colored top
face and theme-aware sides.
