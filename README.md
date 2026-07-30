# Simon Gorbet Photography

A custom Hugo editorial photography portfolio. The example site uses the reusable `themes/simon-photo-gallery` theme, a provider-neutral YAML manifest, Hugo Pipes, and a small vanilla JavaScript dialog. No existing theme, frontend framework, image downloader, or lightbox library is used.

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

Only `src` is required. Date and location default to `unknown`. Set `favourite: true` to move an image ahead of non-favourites; order remains stable within both groups. The filename supplies the ID and title, the configured photographer supplies fallback alt text, and the theme supplies dimensions and layout defaults.

Advanced overrides remain available when needed: `id`, `title`, `alt`, `dimensions`, `urls`, `credit`, and `layout` use the original provider-neutral schema. Explicit variant URLs take precedence over `src`.

Unknown metadata is displayed honestly as `Unknown`; add a date or location only when you know it.

## Adding, removing, and editing photographs

Add a record containing `src` to the `photos` array; remove the record to remove a photograph. Use ISO `YYYY-MM-DD` dates when known. Use a plain location string such as `Yosemite, United States`. Omit either field to display `Unknown`. Mark any number of records as `favourite: true` to place them first.

The default desktop layout automatically cycles through three equal columns. For an optional custom placement, `layout.column_start` is a 1–12 start line, `column_span` is its width, and `row_span` controls height. Tablet and mobile rules ignore desktop columns. Set `layout.object_position` (for example, `"30% 50%"`) only when a crop needs adjustment.

## Detail view, controls, and accessibility

Selecting a thumbnail opens a native modal `<dialog>`. Left/Right arrows and visible controls navigate with wraparound; Escape and Close dismiss; horizontal touch swipes navigate when horizontal movement clearly exceeds vertical movement. Adjacent detail images alone are preloaded. Stable `#photo=id` hashes support direct links and browser Back. Closing restores thumbnail focus, Tab is trapped, metadata is politely announced, and focus indicators do not rely on colour alone.

The first row loads eagerly; later images are lazy with intrinsic dimensions, `srcset`, `sizes`, async decoding, and provider-neutral manifest URLs. Reduced-motion preferences suppress nonessential motion.

## Replacing the animation

Transition styles live in `assets/css/lightbox.css`; orchestration is isolated in `transition()` in `assets/js/gallery.js`. Change `params.transitionDuration` and `params.transitionEasing` in `hugo.toml`, or replace that function and the `.lightbox`/`.is-changing` rules. Supported browsers use View Transitions; others receive a small opacity/scale fallback.

## About page

Edit `content/about.md` using normal Markdown. Its biography, interests, contact, and ownership sections are placeholders. Site name, footer text, description, and transition settings belong in `hugo.toml`, not theme templates.

## Production and Cloudflare Workers

```sh
npm run build
npm run deploy:dry-run
```

`wrangler.toml` deploys `./public` as Workers Static Assets. To perform a real deployment, configure credentials outside the repository and run `wrangler deploy`; no account ID, token, domain, R2 binding, or secret belongs here.

## R2 image hosting

The example loads its photograph directly from the configured public R2 URL. Hugo never downloads or commits the remote original. Add Cloudflare Image Transformation URLs through the advanced `urls` override when automatic web-sized delivery is enabled.

## Future R2 migration

The intended flow is **R2 originals → image variants/processing Worker → generated gallery manifest → Hugo theme**. A future generator should emit the same schema into `data/gallery.yaml`, changing only `urls` (and relevant metadata). Set `params.images.provider = "r2"` for documentation/configuration and optionally set `baseURL = "https://images.example.com"` for relative manifest paths. Layouts neither inspect the provider nor construct provider URLs, list buckets, or fetch originals.

## Troubleshooting

* Confirm `hugo version` says `v0.161.1` and `extended` if templates fail unexpectedly.
* Run `npm run validate` for JavaScript syntax errors.
* Read Hugo's named gallery record in build errors and correct the corresponding YAML field.
* If a crop looks wrong, adjust `object_position`; do not change intrinsic dimensions unless the source itself changes.
* If a hash does not open, ensure it exactly matches a unique `id`.
* If Cloudflare dry-run fails, rebuild first and confirm `public/index.html` exists.
