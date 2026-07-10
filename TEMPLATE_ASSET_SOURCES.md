# Template and Placeholder Asset Sources

## Template references

The richer preview renderer uses layout patterns inspired by downloaded Start Bootstrap templates:

- `startbootstrap-creative`
- `startbootstrap-agency`
- `startbootstrap-business-frontpage`
- `startbootstrap-landing-page`
- `startbootstrap-shop-homepage`
- `startbootstrap-freelancer`

The downloaded source archives live in `.tools/template-sources/`, which is intentionally gitignored. Start Bootstrap free templates are MIT licensed, so the app can safely use the patterns and ideas without vendoring full template source into the product.

## Placeholder image library

Placeholder images are downloaded into `public/placeholders/` with:

```bash
npm run assets:placeholders
```

The downloader pulls thumbnail images from the WordPress Photo Directory search pages and writes `public/placeholders/manifest.json`.

The WordPress Photo Directory publishes CC0 photos. The manifest is still kept so final production projects can audit or replace placeholder imagery before client launch.
