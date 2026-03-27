## [2026-03-27] - Sample data must never override the active student
**What happened**: Loading a sample PGN during import could silently switch the current import away from the real selected student and back onto the seeded demo student. That made the workflow feel like a demo instead of a coach tool and created mismatched review identities.
**Root cause**: The sample loader treated the demo student as the preferred target whenever the seed profile existed, instead of respecting the student already selected in the import flow.
**Fix applied**: The import flow now keeps the active selected student when loading a sample PGN and only falls back to the seeded demo profile when there is no real student context yet.
**Rule going forward**: Demo/sample affordances can preload content, but they must never hijack or overwrite the user’s current working entity unless the user explicitly chooses the demo entity.

## [2026-03-27] - Offline cache matching must handle multiple request shapes
**What happened**: The production bundle assets were present in the service-worker cache, but offline route loads could still fail because CSS and JS requests were not always matched back out of the cache during fetch handling.
**Root cause**: The service worker relied on a single cache lookup shape, while real requests could differ by request object, absolute URL, pathname plus search, or normalized pathname.
**Fix applied**: The service worker now resolves cache hits through a shared matcher that checks the request object, absolute URL, pathname plus search, and pathname, and the cache version was bumped to force a clean reinstall.
**Rule going forward**: When an offline app pre-caches hashed build assets, cache lookups should always normalize and try multiple equivalent request forms rather than assuming one request representation will match every browser fetch.
