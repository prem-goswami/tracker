# Job Application Tracker

A single-page job application tracker. All data is stored in your browser
on your own device — nothing is sent anywhere, and there is no backend.

## Deploy

1. Push these files to the root of a GitHub repo.
2. Repo → Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Wait ~1 minute, then open the published URL.
4. In Chrome: ⋮ → Cast, save, and share → **Install page as app**.

## Updating

After changing `index.html`, bump `CACHE_VERSION` in `sw.js` (`v1` → `v2`) and push.
Open windows will show a "newer version is ready" prompt with a Reload button.
Skipping the bump means the service worker may keep serving the old assets.

## Backups

Data lives in browser storage, tied to this exact URL. It is not synced between
devices and will be erased if you clear site data. Use the **Backup** button
periodically; **Restore** reads that file back in.

## Files

- `index.html` — the entire app (HTML, CSS, JS)
- `manifest.webmanifest` — install metadata
- `sw.js` — offline caching and update handling
- `icons/` — app icons
