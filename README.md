# ghostnode

Built by DARKSOL

<p align="center">
  <img src="https://raw.githubusercontent.com/darks0l/ghostnode/main/assets/darksol-banner.png" alt="DARKSOL banner" width="100%"/>
</p>

<p align="center">
  English · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md">Español</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md">Português (Brasil)</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md">中文</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md">日本語</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md">Tiếng Việt</a>
</p>

`ghostnode` is a privacy firewall for Node.js apps.

It inspects outbound boundaries and helps you detect, redact, or block sensitive data before it leaves your process.

Think:

- HTTP requests
- logs
- analytics and telemetry payloads
- AI and agent calls
- debug output

## Install

```bash
npm install ghostnode
```

## Quick Start

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  includePreview: true,
  onEvent(event) {
    console.error("GhostNode detected a potential data leak", event);
  }
});
```

You can also preload it automatically:

```bash
GHOSTNODE=audit node app.js
```

Or scan an app from the outside:

```bash
npx ghostnode scan -- node server.js
```

Or emit a machine-readable report:

```bash
npx ghostnode scan --mode audit --report ghostnode-report.json -- node server.js
```

## Modes

- `audit`: detect and report leaks, but allow the original operation
- `redact`: sanitize detected data, then allow the original operation
- `block`: stop the operation when a leak is detected

## Boundaries

GhostNode currently covers:

- `fetch`
- `console`
- generic logger objects
- `pino` through `createPinoLogger(...)`
- `winston` through `createWinstonLogger(...)`

## Logger Adapters

```js
import { createPinoLogger, createWinstonLogger } from "ghostnode";

const safePino = createPinoLogger(pinoLogger, { mode: "redact" });
const safeWinston = createWinstonLogger(winstonLogger, { mode: "audit" });
```

## HTTP Helpers

```js
import { createFetchProxy, sanitizeRequest } from "ghostnode";

const safeFetch = createFetchProxy({
  mode: "redact",
  onRequest(request) {
    console.log("outbound request", request);
  }
});

const sanitized = sanitizeRequest("https://api.example.com?email=john@example.com", {
  headers: {
    authorization: "Bearer token-value"
  }
});
```

## What It Detects

Built-in detectors cover:

- emails
- IP addresses
- bearer tokens
- API keys
- JWTs
- cookies
- passwords
- payment-card-like values

You can also add custom secrets and custom sensitive-key rules.

## Structured Events

Every detection can emit a structured event with:

- `boundary`
- `destination`
- `findings`
- `severity`
- `action`
- optional `sourceLocation` like `src/server.js:42:17` for fast callsite tracing
- optional sanitized `preview` data when `includePreview: true`

That gives you something useful for logging, tests, CI, and incident review instead of a vague boolean.

## Scan Reports

`ghostnode scan` can write JSON output with severity counts, source hotspots, and full event detail:

```bash
npx ghostnode scan --mode audit --report ghostnode-report.json -- node app.js
```

## Promise

The promise stays simple:

> GhostNode detects sensitive data leaving your Node.js application.

## Translation Note

Translations are welcome.

The main README stays compact in English, and full translations live under [`docs/i18n/`](https://github.com/darks0l/ghostnode/tree/main/docs/i18n).

## Direction

Strong next expansions:

- telemetry and error-reporter integrations
- richer policy controls and severity thresholds
- more first-class outbound adapters

> GhostNode
> Your data was never there.
