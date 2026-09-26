# Elm Auto homepage

Responsive homepage client preview for Elm Auto, with the real logo, vehicle category selector, 13-photo customer slider, and application links to Elm Auto’s existing website.

## Development

Requires Node.js 24.

```sh
npm ci
npm run build
npm test
npm run dev
```

The homepage HTML and styles live in `dist/index.html` and `dist/style.css`. Edit interactions in `src/app.js`, then run `npm run build` to update `dist/app.js`.

## GitHub Pages

In repository **Settings → Pages**, set the source to **GitHub Actions**. The included workflow tests, builds, and publishes `dist` after changes to `main`. It can also be run manually from the Actions tab.

All local asset links are relative, so the page works under a GitHub Pages project path. No API keys, hosting credentials, or backend are required.

## Images and dependencies

Customer photos and the logo originate from Elm Auto’s public website. Vehicle category images are illustrative stock photographs. Source records are in `docs/asset-provenance.md`; third-party software notices are in `dist/THIRD_PARTY_LICENSES.txt`. Brand assets and photography retain their respective owners’ rights.
