# Deployment Notes

## Best Host

Use Vercel for the first public deployment. This app is a static Vite build and already includes SPA rewrites plus service-worker-friendly headers.

## Vercel Settings

```text
Framework preset: Vite
Build command: npm run build
Output directory: dist
Install command: npm install
```

No environment variables are required.

## Recommended GitHub Prep

1. Put `C:\Users\JobSearch\Documents\Codex\deepgame-coaching-os` in its own repository.
2. Keep the first commit clean:
   - app source
   - brand assets
   - README
   - DEPLOY.md
3. Use the repo name `deepgame-coaching-os` or `deepgame-coaching`.

## Release Checklist

Before pushing:

- `npm run lint`
- `npm run build`
- confirm the new DeepGame logo appears in the header
- confirm the manifest uses the new icon set
- confirm `brand-assets/deepgame-logo-pack.zip` exists if you want the design pack versioned

After Vercel deploy:

1. Open the live app while online.
2. Visit the dashboard.
3. Open intake.
4. Import a real PGN.
5. Open the generated report.
6. Run a local deep review.
7. Turn Wi-Fi off.
8. Refresh the app.
9. Repeat dashboard and review checks.

## Important Offline Note

The app is offline-first, not magic-first. The deployed site should be opened once online so the service worker can cache the current build assets.

## Routing And Caching

Already configured:

- `vercel.json` handles SPA rewrites
- `public/sw.js` pre-caches build assets
- `src/lib/serviceWorker.ts` warms the offline cache after install

## Local Build Path

Run builds from the real path:

`C:\Users\JobSearch\Documents\Codex\deepgame-coaching-os`

Do not build from the `New project` linked path. The app works there as a workspace entry point, but Vite output is more reliable from the real target path.

## What To Say Publicly

Short version:

> DeepGame Coaching OS is an offline-first chess coaching workspace that turns PGNs into coaching reports, style fingerprints, and local Stockfish reviews with zero paid APIs at runtime.

Longer version:

> I built a local-first coaching product for chess improvement. It parses PGNs in-browser, stores data in IndexedDB, generates structured coaching reports, and runs deep review with local Stockfish, all inside a premium brand-aligned React PWA.
