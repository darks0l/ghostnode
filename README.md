# ghostnode

Built by DARKSOL 🌑

<p align="center">
  <img src="https://raw.githubusercontent.com/darks0l/ghostnode/main/assets/darksol-banner.png" alt="DARKSOL banner" width="100%"/>
</p>

<p align="center">
  English · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md">Español</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md">Português (Brasil)</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md">中文</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md">日本語</a> · <a href="https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md">Tiếng Việt</a>
</p>

`ghostnode` is a privacy firewall for Node.js apps.

It watches outbound boundaries and tells you when sensitive data is about to leave your process.

Think HTTP requests, logs, analytics, telemetry, AI calls, and debug output.

## Install

```bash
npm install ghostnode
```

## Quick Start

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode detected a potential data leak", event);
  }
});
```

Or make it automatic:

```bash
GHOSTNODE=audit node app.js
```

Or scan an app from the outside:

```bash
npx ghostnode scan -- node server.js
```

Or export a machine-readable report:

```bash
npx ghostnode scan --mode audit --report ghostnode-report.json -- node server.js
```

## Boundaries

- `fetch`
- `console`
- generic logger objects
- `pino` via `createPinoLogger(...)`
- `winston` via `createWinstonLogger(...)`

## Logger Adapters

```js
import { createPinoLogger, createWinstonLogger } from "ghostnode";

const safePino = createPinoLogger(pinoLogger, { mode: "redact" });
const safeWinston = createWinstonLogger(winstonLogger, { mode: "audit" });
```

These adapters keep the same `audit` / `redact` / `block` model while giving backend teams a clearer drop-in path.

## Modes

- `audit`: detect and report leaks, but allow the original operation
- `redact`: sanitize detected data, then allow the original operation
- `block`: stop the operation when a leak is detected

Every detection can emit a structured event with:

- boundary
- destination
- findings
- severity
- action taken

The promise stays simple:

> GhostNode detects sensitive data leaving your Node.js application.

## Scan Reports

`ghostnode scan` can now write JSON output with severity counts and full event detail:

```bash
npx ghostnode scan --mode audit --report ghostnode-report.json -- node app.js
```

## Translation Note

Translations are welcome.

The main README stays compact in English, and full translations live under [`docs/i18n/`](https://github.com/darks0l/ghostnode/tree/main/docs/i18n) so the landing page stays clean.

## Direction

Next obvious expansions:

- source-aware leak tracing
- telemetry and error reporter integrations
- richer severity policies

> GhostNode
> Your data was never there.

Built with teeth. 🌑
