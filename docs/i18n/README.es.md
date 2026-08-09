# ghostnode

Built by DARKSOL 🌑

`ghostnode` es un firewall de privacidad para aplicaciones Node.js.

Observa los límites de salida y te avisa cuando datos sensibles están a punto de salir de tu proceso.

Piensa en solicitudes HTTP, logs, analítica, telemetría, llamadas a IA y salida de depuración.

## Idiomas

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- Español
- [Português (Brasil)](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md)
- [中文](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md)
- [日本語](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md)
- [Tiếng Việt](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md)

## Instalar

```bash
npm install ghostnode
```

## Inicio rápido

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode detectó una posible fuga", event);
  }
});
```

## Superficies actuales

- `fetch`
- `console`
- loggers genéricos
- `pino` con `createPinoLogger(...)`
- `winston` con `createWinstonLogger(...)`
- `ghostnode scan` con exportación JSON

## Modos

- `audit`
- `redact`
- `block`

## Nota de traducciones

Las traducciones son bienvenidas.

La página principal sigue compacta en inglés y las traducciones completas viven en `docs/i18n/`.

> GhostNode detecta datos sensibles saliendo de tu aplicación Node.js.

Built with teeth. 🌑
