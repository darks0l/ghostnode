# Changelog

All notable changes to `ghostnode` are documented here.

## [0.7.0] - 2026-08-18

### Added

- Added concise `sourceLocation` labels on firewall and logger events so callers can identify the user-land callsite without parsing the full stack payload.
- Added source-aware CLI scan reporting with per-event source locations plus aggregated `sourceCounts` and `topSources` in JSON reports.
- Added regression coverage for source-aware event metadata and CLI report summaries.

## [0.6.0] - 2026-08-15

### Added

- Added opt-in sanitized event previews via `includePreview: true` so firewall and logger events can include redacted request/argument snapshots without leaking raw secrets.
- Added source-aware regression coverage for event previews across fetch and logger flows.

## [0.5.0] - 2026-08-09

### Added

- Recursive `ghost(...)` redaction for objects, arrays, and inline sensitive strings.
- Built-in detectors for emails, IP addresses, bearer tokens, API keys, JWTs, cookies, passwords, and card-like values.
- `ghostnode/shield` auto-install path for console-level leak protection.
- Custom secret and sensitive-key support with zero runtime dependencies.
- Runtime firewall mode with `audit`, `redact`, and `block` policies for `fetch` and `console`.
- Structured leak findings and `installGhostNode(...)` bootstrapping, including `GHOSTNODE=<mode>` support.
- HTTP edge helpers for sanitized requests, fetch proxying, and Express-style middleware snapshots.
- Safe logger wrapping with the same `audit` / `redact` / `block` policy surface.
- `ghostnode scan` CLI for preloading the firewall into a child Node process and printing a privacy scan summary.
- Clean multilingual README navigation with dedicated translation pages.
- Severity scoring for findings and scan summaries.
- `ghostnode scan --report ...` JSON export for machine-readable scan output.
- Chinese, Japanese, and Vietnamese translation pages.
- First-class `createPinoLogger(...)` and `createWinstonLogger(...)` adapter surfaces.
- README refresh across all language pages with a small translation welcome note.
