# ikutamoha.me

Personal portfolio — music and graphic design. Plain HTML/CSS, hosted free on GitHub Pages.

## Editing

Everything you'll change is in `index.html`; look for `EDIT:` / `WHEN ... IS READY` comments.

The site is in Japanese. Until content is ready, each section shows a 近日公開 (coming soon)
badge and empty 準備中 slots; the comment inside each section has the markup to paste in
when its content arrives (tracks, gallery, profile, contact).

- **Music:** paste embed `<iframe>`s from SoundCloud / YouTube / Bandcamp
  (examples in the comment above the tracks). Don't put audio files in this repo.
- **Design work:** drop images into `images/` (JPG/WebP, ~1600px wide, < 500 KB)
  and update the `<figure>` blocks.
- **Colours / fonts:** the variables at the top of `css/style.css` (light and dark sets).
- **Logo:** `images/logo.svg` is a single path with `id="logo"` and `fill="currentColor"`,
  so `<svg viewBox="0 0 2934 3956"><use href="images/logo.svg#logo"/></svg>` takes the
  text colour (black on light, white on dark). `images/star.svg` is the matching
  four-point star used across the site; `images/favicon.svg` is the browser tab icon.

Preview locally with `pwsh -NoProfile -File tools/serve.ps1 -Root . -Port 8080`
and open http://localhost:8080/ (the logo doesn't show when opening `index.html` as a file).
The logo is made from an image with `tools/logo/vectorize.html`; see [tools/README.md](tools/README.md). Commit and push to `main`;
GitHub Pages republishes in about a minute.

## Hosting

- GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`
- Custom domain: `CNAME` file contains `ikutamoha.me`
- DNS (GoDaddy): four `A` records for `@` → 185.199.108.153, .109.153, .110.153, .111.153;
  `CNAME` `www` → `mohammadyeku.github.io`
