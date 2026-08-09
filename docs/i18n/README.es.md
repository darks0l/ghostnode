# ghostnode

Built by DARKSOL 🌑

`ghostnode` es un firewall de privacidad para aplicaciones Node.js.

Observa los límites de salida y te avisa cuando datos sensibles están a punto de salir de tu proceso.

Piensa en solicitudes HTTP, logs, analítica, telemetría, llamadas a IA y salida de depuración.

## Idiomas

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- Español
- [Português (Brasil)](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md)

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

O automático:

```bash
GHOSTNODE=audit node app.js
```

O escanear una app desde afuera:

```bash
npx ghostnode scan -- node server.js
```

## Modos

- `audit`: detecta y reporta fugas, pero permite la operación
- `redact`: sanitiza datos sensibles y luego permite la operación
- `block`: detiene la operación cuando detecta una fuga

## Superficies actuales

- protección de `fetch`
- protección de `console`
- protección de logger con `createSafeLogger(...)`
- helper HTTP para solicitudes saneadas
- `ghostnode scan` para escanear otro proceso Node

## Idea central

> GhostNode detecta datos sensibles saliendo de tu aplicación Node.js.

## Nota

La documentación principal sigue en inglés. Estas páginas de idioma mantienen la introducción clara y rápida para más gente sin ensuciar el README principal.

Built with teeth. 🌑
