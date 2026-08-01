# Simon Photo Gallery theme

A reusable Hugo 0.161.1+ editorial gallery theme using semantic templates, CSS Grid, Hugo Pipes, a native dialog, and vanilla JavaScript.

## Install and configure

Copy this directory to `themes/simon-photo-gallery`, set `theme = "simon-photo-gallery"`, and provide `data/gallery.yaml`. Configure `params.photographer`, `params.copyright`, `params.description`, transition values, and `params.images` in the site configuration. See the repository README for the full manifest schema.

The theme expects an ordered `photos` array. Only `src` is required; location defaults to `unknown`, browser image dimensions determine orientation, and `favourite: true` moves a record ahead of regular photographs. The example site's metadata script extracts EXIF capture dates into `data/gallery-metadata.json`; missing dates render as `Unknown`. `params.images.transforms` generates web-sized URLs from the configured transformation endpoint.

## Customise

Override any layout or asset from the example site's matching directory. Colours and global structure live in `assets/css/main.css`, deterministic collage rules in `gallery.css`, and the replaceable detail transition in `lightbox.css`. Keep site-specific content and image records outside the theme.

The first three images are eager and all remaining images lazy. Keyboard, pointer, touch, hashes, focus management, adjacent preloading, and animation orchestration are contained in `assets/js/gallery.js`. The static grid requires no JavaScript.
