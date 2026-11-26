# Tools

## `logo/vectorize.html` — turn a logo image into the site's `logo.svg`

This is how the current `images/logo.svg` was made (Nov 2026), from the cleaned-up logo
exported from Photoshop: an SVG that only wrapped a 2947×3941 PNG (4.6 MB) became a
28 KB vector path that differs from the image by ~0.3% of its pixels, all along the edges.

1. Serve the project (see `serve.ps1` below) and open http://localhost:8080/tools/logo/vectorize.html
2. Choose the image: PNG, JPG, or an SVG that only wraps a picture (black on white or on transparent).
3. Press **Vectorize**. The right-hand panel shows lost ink in red and added ink in blue.
4. **Download logo.svg** and put it in `images/`. If its `viewBox` size changed, update
   `viewBox` / `aspect-ratio` in `index.html`, `404.html` and `css/style.css` (currently `2934 3956`).

Defaults: blur 1, threshold 128, smoothing 3, corner angle 50°, tolerance 0.5, scale 1.
Scale 0.5 / tolerance 0.8 gives ~18 KB at ~0.6% difference, also invisible on screen.

## `logo/index.html` — the earlier rebuild from the hand-drawn scan

`logo/logo-original.webp` is the hand-drawn original. `logo/index.html` turns it into
`images/logo.svg`, `images/favicon.svg` and `images/star.svg`:

1. Smooths the scanned edges (upscale ×2, blur, threshold).
2. Evens out stroke weight per piece, toward `target` px.
3. Replaces the free-standing stars with identical geometric four-point stars.
4. Moves 多 and 晴 so every pair of characters has ~41–45 px of space.
5. Traces the outlines, keeps sharp tips as corners, smooths everything between them.

All settings are in `SETTINGS` near the bottom of `logo/index.html`.

**To run it:** serve the project folder over http (the page can't load the scan from
`file://`), e.g. in PowerShell from the project folder:

```powershell
pwsh -NoProfile -File tools/serve.ps1 -Root . -Port 8080
```

then open http://localhost:8080/tools/logo/ and press **Rebuild logo**. It reproduces the
previous site logo (1423×1829, commit `ec4ebf6`) and the current `favicon.svg` / `star.svg`
byte-for-byte; its logo no longer matches `images/logo.svg`, which now comes from
`vectorize.html` above.

Needs a Chromium-based browser for identical output (canvas blur differs slightly
between browsers). The tracer is pinned to imagetracerjs 1.2.6 from jsDelivr.

## `serve.ps1` — tiny local web server

`pwsh -NoProfile -File tools/serve.ps1 -Root . -Port 8080` serves the site at
http://localhost:8080/ for previewing (shows `404.html` for missing pages, like GitHub Pages).
