# Jellyfin Wrapped

Spotify Wrapped–style year in review for Jellyfin, powered by [Tracearr](https://tracearr.com) history and Jellyfin images.

## Roles

- **Admin** — Open `/setup`, set an admin password, then save Tracearr URL, Tracearr API key, Jellyfin server URL, and year. Stored in `localStorage` as `tracearr_admin_config`. Admin password hash: `admin_password_hash`.
- **User** — Open `/`, sign in with Jellyfin username and password. Wrapped loads from Tracearr and posters/backdrops from Jellyfin using the session token.

## Development

```bash
npm install
npm run dev
```

## CORS (self‑hosted)

This app calls **three origins** from the browser:

1. **Tracearr** — REST API and OpenAPI (`/api-docs/json`, etc.). Tracearr must allow your app origin (e.g. set `CORS_ORIGIN` / equivalent in Tracearr’s environment so the browser can read responses).
2. **Jellyfin** — `POST /Users/AuthenticateByName` and image URLs (`/Items/.../Images/...`). Jellyfin must allow the app origin for API and image requests (see Jellyfin networking / known proxies settings).
3. **Your Wrapped app** — static hosting only needs to serve `index.html` for all routes (SPA fallback) when using React Router `BrowserRouter`.

If the browser blocks a request, open DevTools → Network: failed requests show CORS or mixed-content errors.

## Security notes

- Admin and Tracearr credentials live in **localStorage**; Jellyfin tokens in **sessionStorage**. Suitable for trusted devices / homelab; not a multi-tenant SaaS model.
- Use HTTPS in production for both Jellyfin and Tracearr.
