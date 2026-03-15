# DIV2BUILDS — fixed static package

This package is ready to upload to a GitHub repository or GitHub Pages project.

## What changed
- Split the project into `css/`, `js/`, `data/`, and `icons/`
- Replaced the giant hardcoded HTML structure with a smaller data-driven app
- Added `builds.json` and expanded `items.json` with gear pieces used by the builds
- Added a local item explorer
- Added an AI build lab that only generates from known local templates
- Added a heuristic build inspector with an honesty disclaimer
- Switched manifest and service worker paths to relative URLs

## Folder structure
- `index.html`
- `css/styles.css`
- `js/app.js`
- `data/builds.json`
- `data/items.json`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `manifest.json`
- `sw.js`

