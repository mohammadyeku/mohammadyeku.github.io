# ikutamoha.me

Personal portfolio — music and graphic design. Plain HTML/CSS, hosted free on GitHub Pages.

## Editing

Everything you'll change is in `index.html`; look for `EDIT:` comments.

- **Music:** paste embed `<iframe>`s from SoundCloud / YouTube / Bandcamp
  (examples in the comment above the tracks). Don't put audio files in this repo.
- **Design work:** drop images into `images/` (JPG/WebP, ~1600px wide, < 500 KB)
  and update the `<figure>` blocks.
- **Colours / fonts:** the variables at the top of `css/style.css`.

Preview locally by opening `index.html` in a browser. Commit and push to `main`;
GitHub Pages republishes in about a minute.

## Hosting

- GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`
- Custom domain: `CNAME` file contains `ikutamoha.me`
- DNS (GoDaddy): four `A` records for `@` → 185.199.108.153, .109.153, .110.153, .111.153;
  `CNAME` `www` → `mohammadyeku.github.io`
