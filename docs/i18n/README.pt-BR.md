# ghostnode

Built by DARKSOL 🌑

`ghostnode` é um firewall de privacidade para aplicações Node.js.

Ele observa os limites de saída e avisa quando dados sensíveis estão prestes a sair do seu processo.

Pense em requisições HTTP, logs, analytics, telemetria, chamadas para IA e saída de debug.

## Idiomas

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- [Español](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md)
- Português (Brasil)
- [中文](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md)
- [日本語](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md)
- [Tiếng Việt](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md)

## Instalação

```bash
npm install ghostnode
```

## Início rápido

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode detectou um possível vazamento", event);
  }
});
```

## Superfícies atuais

- `fetch`
- `console`
- loggers genéricos
- `pino` com `createPinoLogger(...)`
- `winston` com `createWinstonLogger(...)`
- `ghostnode scan` com exportação JSON

## Modos

- `audit`
- `redact`
- `block`

## Nota sobre traduções

Traduções são bem-vindas.

O README principal continua compacto em inglês e as traduções completas vivem em `docs/i18n/`.

> GhostNode detecta dados sensíveis saindo da sua aplicação Node.js.

Built with teeth. 🌑
