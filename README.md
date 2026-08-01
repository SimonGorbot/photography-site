# Simon Gorbet Photography

A custom Hugo editorial photography portfolio. The example site uses the reusable `themes/simon-photo-gallery` theme, a small YAML manifest, Hugo Pipes, and a vanilla JavaScript dialog. No existing theme, frontend framework, image downloader, or lightbox library is used.

## Requirements and local setup

Install Hugo **0.161.1 Extended** and Node.js, then run:

```sh
npm install --ignore-scripts --no-audit --no-fund
npm run dev
```

The development server includes drafts and disables fast render. After the lockfile exists, use `npm ci --ignore-scripts --no-audit --no-fund` for reproducible installs.

## Architecture and theme structure

The root is a working example site: `hugo.toml` selects the theme, `content/about.md` supplies ordinary Hugo content, and `data/gallery.yaml` owns all image records. The theme contains:

* `layouts/` for the base, homepage, standard page, and focused partials;
* `assets/css/main.css`, `gallery.css`, and `lightbox.css` for site, collage, and replaceable transition styling;
* `assets/js/gallery.js` for the accessible detail-view controller;
* `layouts/partials/responsive-image.html` as the sole grid image renderer.

Hugo Pipes concatenates, minifies, and fingerprints CSS, and separately minifies and fingerprints JavaScript. The page remains a complete image grid without JavaScript.

## Gallery manifest

`data/gallery.yaml` contains an ordered `photos` array. Adding a photograph normally requires only its public URL:

```yaml
- src: https://images.example.com/photos/my-photo.jpg
  date: "2025-09-14"
  location: Chamonix, France
  favourite: true
```

Only `src` is required. Date and location default to `unknown`. Set `favourite: true` to move an image ahead of non-favourites; order remains stable within both groups. The filename supplies the internal ID, the theme supplies accessible fallback text, and image orientation is detected automatically in the browser. Configured image transformations automatically produce the thumbnail, grid, and detail URLs from that single source.

Unknown metadata is displayed honestly as `Unknown`; add a date or location only when you know it.

## Adding, removing, and editing photographs

Add a record containing `src` to the `photos` array; remove the record to remove a photograph. Use ISO `YYYY-MM-DD` dates when known. Use a plain location string such as `Yosemite, United States`. Omit either field to display `Unknown`. Mark any number of records as `favourite: true` to place them first.

The default desktop layout automatically cycles through three equal columns. Once a thumbnail loads, its natural dimensions determine whether its grid cell is portrait or landscape; no orientation or layout setting is required.

## Detail view, controls, and accessibility

Selecting a thumbnail opens a native modal `<dialog>`. Left/Right arrows and visible controls navigate with wraparound; Escape and Close dismiss; horizontal touch swipes navigate when horizontal movement clearly exceeds vertical movement. Adjacent detail images alone are preloaded. Stable `#photo=id` hashes support direct links and browser Back. Closing restores thumbnail focus, Tab is trapped, metadata is politely announced, and focus indicators do not rely on colour alone.

The first row loads eagerly; later images are lazy with `srcset`, `sizes`, async decoding, and transformed R2 URLs. Reduced-motion preferences suppress nonessential motion.

## Replacing the animation

Transition styles live in `assets/css/lightbox.css`; orchestration is isolated in `transition()` in `assets/js/gallery.js`. Change `params.transitionDuration` and `params.transitionEasing` in `hugo.toml`, or replace that function and the `.lightbox`/`.is-changing` rules. Supported browsers use View Transitions; others receive a small opacity/scale fallback.

## About page

Edit `content/about.md` using normal Markdown. Its biography, interests, contact, and ownership sections are placeholders. Site name, footer text, description, and transition settings belong in `hugo.toml`, not theme templates.

## Production and Cloudflare Workers

```sh
npm run build
npm run deploy:dry-run
```

`wrangler.toml` deploys `./public` as Workers Static Assets. To perform a real deployment, authenticate Wrangler outside the repository and run `wrangler deploy`.

## R2 image hosting

The example stores originals at the configured public R2 origin, while Cloudflare Image Transformations serve 480-pixel thumbnails, 1200-pixel grid images, and 2400-pixel detail images. Hugo never downloads or commits the remote originals. Transformation settings live once in `hugo.toml`; individual records still need only `src`.

## Sensitive information and Git

Never commit Cloudflare API tokens, R2 access keys, account IDs, Wrangler session data, `.dev.vars`, or `.env` files. The repository ignores the common local secret files and `.wrangler/` state, but always inspect `git diff --staged` before pushing.

The R2 hostname, object paths, photograph dates, and locations in `data/gallery.yaml` are intentionally public: Hugo embeds them in the generated page. Do not put private bucket names, private object keys, home addresses, or sensitive location data in the manifest. The configured R2 origin is public, so visitors can derive and download the original object URL. Strip private EXIF metadata—especially GPS coordinates—from photographs before uploading, or use a private-origin image delivery architecture if originals must not be public.

Safe to commit: public image URLs, public site configuration, Wrangler's compatibility date, package-lock integrity hashes, and transformation dimensions. Keep all credentials in the Cloudflare dashboard, Wrangler's external authentication store, or ignored local environment files.

## Troubleshooting

* Confirm `hugo version` says `v0.161.1` and `extended` if templates fail unexpectedly.
* Run `npm run validate` for JavaScript syntax errors.
* Read Hugo's gallery index in build errors and ensure that record has a public `src`.
* If a hash does not open, ensure it exactly matches a unique `id`.
* If Cloudflare dry-run fails, rebuild first and confirm `public/index.html` exists.
