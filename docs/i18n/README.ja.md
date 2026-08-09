# ghostnode

Built by DARKSOL 🌑

`ghostnode` は Node.js アプリ向けのプライバシー・ファイアウォールです。

外向きの境界を監視し、機密データがプロセスの外へ出ようとした時に検知します。

HTTP リクエスト、ログ、分析、テレメトリ、AI 呼び出し、デバッグ出力を対象にできます。

## 言語

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- [Español](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md)
- [Português (Brasil)](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md)
- [中文](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md)
- 日本語
- [Tiếng Việt](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.vi.md)

## インストール

```bash
npm install ghostnode
```

## クイックスタート

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode が潜在的な漏えいを検出しました", event);
  }
});
```

自動有効化:

```bash
GHOSTNODE=audit node app.js
```

外部から Node プロセスをスキャン:

```bash
npx ghostnode scan -- node server.js
```

## モード

- `audit`: 漏えいを検出して報告するが、処理は継続
- `redact`: 機密値をマスクしてから処理を継続
- `block`: 漏えい検出時に処理を停止

## 現在の保護対象

- `fetch`
- `console`
- `createSafeLogger(...)` によるロガー保護
- サニタイズ済み HTTP ヘルパー
- `ghostnode scan` CLI

## コアメッセージ

> GhostNode は Node.js アプリから出ていく機密データを検出します。

Built with teeth. 🌑
