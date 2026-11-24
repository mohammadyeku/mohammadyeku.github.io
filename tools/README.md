# Tools

## `logo/` — rebuild the logo from the original scan

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

then open http://localhost:8080/tools/logo/ and press **Rebuild logo**. With the current
settings the result is identical to the files in `images/`; the log says so. Change a
setting, rebuild, and use the download buttons to replace files in `images/`.
If you change the logo's size, update `viewBox` / `aspect-ratio` `1423 / 1829` in
`index.html`, `404.html` and `css/style.css`.

Needs a Chromium-based browser for identical output (canvas blur differs slightly
between browsers). The tracer is pinned to imagetracerjs 1.2.6 from jsDelivr.

## `serve.ps1` — tiny local web server

`pwsh -NoProfile -File tools/serve.ps1 -Root . -Port 8080` serves the site at
http://localhost:8080/ for previewing (shows `404.html` for missing pages, like GitHub Pages).
