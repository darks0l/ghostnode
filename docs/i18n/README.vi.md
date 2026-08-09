# ghostnode

Built by DARKSOL 🌑

`ghostnode` là một tường lửa quyền riêng tư cho ứng dụng Node.js.

Nó theo dõi các ranh giới đi ra ngoài và cảnh báo khi dữ liệu nhạy cảm sắp rời khỏi tiến trình của bạn.

Hãy nghĩ tới HTTP request, log, analytics, telemetry, lệnh gọi AI và output debug.

## Ngôn ngữ

- [English](https://github.com/darks0l/ghostnode/blob/main/README.md)
- [Español](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.es.md)
- [Português (Brasil)](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.pt-BR.md)
- [中文](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.zh-CN.md)
- [日本語](https://github.com/darks0l/ghostnode/blob/main/docs/i18n/README.ja.md)
- Tiếng Việt

## Cài đặt

```bash
npm install ghostnode
```

## Bắt đầu nhanh

```js
import { installGhostNode } from "ghostnode";

installGhostNode({
  mode: "audit",
  onEvent(event) {
    console.error("GhostNode đã phát hiện rò rỉ tiềm năng", event);
  }
});
```

Hoặc bật tự động:

```bash
GHOSTNODE=audit node app.js
```

Hoặc quét một tiến trình Node từ bên ngoài:

```bash
npx ghostnode scan -- node server.js
```

## Chế độ

- `audit`: phát hiện và báo cáo rò rỉ nhưng vẫn cho phép chạy
- `redact`: làm sạch dữ liệu nhạy cảm rồi mới cho phép chạy
- `block`: chặn thao tác khi phát hiện rò rỉ

## Các bề mặt hiện tại

- bảo vệ `fetch`
- bảo vệ `console`
- bảo vệ logger với `createSafeLogger(...)`
- helper HTTP đã được làm sạch
- chế độ CLI `ghostnode scan`

## Lời hứa cốt lõi

> GhostNode phát hiện dữ liệu nhạy cảm rời khỏi ứng dụng Node.js của bạn.

Built with teeth. 🌑
