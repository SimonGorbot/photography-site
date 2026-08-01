# Simon Gorbet Photography

Source code for Simon Gorbet's photography portfolio: a minimal editorial gallery built with Hugo and a custom theme.

Photographs are stored in Cloudflare R2 and served through Cloudflare Image Transformations. The site itself is static and deploys with Cloudflare Workers Static Assets. It includes responsive gallery layouts, automatic portrait detection, and an accessible keyboard- and touch-friendly detail view.

## Local development

Requires Hugo **0.161.1 Extended** and Node.js.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Build and validate with:

```sh
npm run validate
npm run build
npm run deploy:dry-run
```

Gallery entries live in `data/gallery.yaml`; site copy lives in `content/`; and the reusable theme lives in `themes/simon-photo-gallery/`.

Do not commit Cloudflare credentials, `.env` files, `.dev.vars`, or sensitive photograph metadata. Public gallery URLs, dates, and locations are intentionally visible in the generated site.

All photographs © Simon Gorbet.
