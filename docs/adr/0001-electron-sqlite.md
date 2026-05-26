# ADR 0001: 使用 Electron + SQLite 构建 Standalone 应用

## 状态

Accepted

## 背景

应用需要离线运行、提供网页式界面、读写本地 Excel、维护本地权威数据库，并最终打包为 Windows exe。

## 决策

使用 Electron 作为桌面封装，SQLite 作为本地权威数据库，React/Vite 构建前端界面。

## 后果

- 优点：离线能力强，本地文件和数据库访问稳定，生态成熟，打包路径清晰。
- 代价：安装包体积大于纯浏览器或 Tauri 方案。
