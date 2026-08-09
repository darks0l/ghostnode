# Changelog

All notable changes to `ghostnode` are documented here.

## [0.3.2] - 2026-08-09

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
