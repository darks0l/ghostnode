# ghostnode

Built by DARKSOL 🌑

`ghostnode` 是一个面向 Node.js 应用的隐私防火墙。

它会监控出站边界，并在敏感数据即将离开你的进程时提醒你。

可以把它理解为对 HTTP 请求、日志、分析、遥测、AI 调用和调试输出的隐私保护层。

## 语言

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- [Español](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md)
- [Português (Brasil)](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md)
- 中文
- [日本語](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md)
- [Tiếng Việt](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md)

## 安装

```bash
npm install ghostnode
```

## 快速开始

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode 检测到了潜在泄漏", event);
  }
});
```

或者自动启用：

```bash
GHOSTNODE=audit node app.js
```

或者扫描一个外部 Node 进程：

```bash
npx ghostnode scan -- node server.js
```

## 模式

- `audit`: 检测并报告泄漏，但允许操作继续
- `redact`: 清理敏感数据后再继续
- `block`: 检测到泄漏时直接阻止操作

## 当前保护面

- `fetch` 保护
- `console` 保护
- `createSafeLogger(...)` 日志保护
- 已清洗的 HTTP 请求辅助工具
- `ghostnode scan` 外部扫描模式

## 核心承诺

> GhostNode 检测离开你的 Node.js 应用的敏感数据。

Built with teeth. 🌑
