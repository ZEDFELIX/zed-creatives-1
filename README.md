# ZED Creatives — Shop & App (PWA)

Progressive Web App storefront for ZED Creatives. Includes marketing pages, catalog/shop, cart and checkout, account pages, and an admin content editor. The main stylesheet (`style.css`) is referenced from every page and the shared logic lives in `app.js`.

## PWA

- `manifest.json` — name, icons (`icon-192.png`, `icon-512.png`), `start_url`
- `sw.js` — service worker with offline app-shell caching (listed in the `APP_SHELL` cache)
- Service worker registration is performed at the end of `app.js` and on every page.

## Deploy

Push the folder and enable GitHub Pages (no build step). For a full PWA, serve over HTTPS (Pages does this automatically).

## Data layer

- `supabase-config.js` — placeholder config; the URL and anon key are empty strings (no secrets committed).
- `zed-db.js` — database helpers; it only initializes a Supabase client when a URL and key are configured, and otherwise the UI falls back to `localStorage` (guarded by `window.ZED_DB_CONFIGURED`).
- `supabase-schema.sql` — reference schema for when a backend is connected.