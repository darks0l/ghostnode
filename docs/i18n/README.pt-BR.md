# ghostnode

Built by DARKSOL 🌑

`ghostnode` é um firewall de privacidade para aplicações Node.js.

Ele observa os limites de saída e avisa quando dados sensíveis estão prestes a sair do seu processo.

Pense em requisições HTTP, logs, analytics, telemetria, chamadas para IA e saída de debug.

## Idiomas

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- [Español](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md)
- Português (Brasil)

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

Ou automático:

```bash
GHOSTNODE=audit node app.js
```

Ou escaneando um app de fora:

```bash
npx ghostnode scan -- node server.js
```

## Modos

- `audit`: detecta e reporta vazamentos, mas permite a operação
- `redact`: sanitiza dados sensíveis e depois permite a operação
- `block`: interrompe a operação quando detecta um vazamento

## Superfícies atuais

- proteção de `fetch`
- proteção de `console`
- proteção de logger com `createSafeLogger(...)`
- helper HTTP para requisições sanitizadas
- `ghostnode scan` para escanear outro processo Node

## Promessa central

> GhostNode detecta dados sensíveis saindo da sua aplicação Node.js.

## Nota

A documentação principal continua em inglês. Essas páginas de idioma deixam a entrada mais acessível sem poluir o README principal.

Built with teeth. 🌑
