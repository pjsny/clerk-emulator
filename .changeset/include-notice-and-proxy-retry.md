---
"clerk-emulator": patch
---

Include the Apache-2.0 `NOTICE` (and `CHANGELOG`) in the published package, and make the clerk-js bundle proxy resilient to transient CDN failures (retry with a per-attempt timeout + in-memory cache).
