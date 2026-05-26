# 架构说明

## 技术栈

- Electron：桌面外壳、文件选择、帮助文档读取、SQLite 与 Python 子进程桥接。
- React + Vite：渲染进程 UI。
- SQLite / better-sqlite3：本地权威数据库。
- RDKit.js：根据 `canonical_smiles` 生成 formula 与 InChIKey。
- smiles-drawer：列表与表单中的 2D SMILES 预览。
- Ketcher standalone：化学结构画板。
- Pixi + DECIMER：图片 OCSR 运行时。

## 数据流

1. 前端通过 preload API 请求 schema、行数据、CSV、校验、化学结构辅助功能。
2. Electron 主进程负责 SQLite CRUD、导入导出、RDKit、OCSR 子进程。
3. `app/shared/schema.ts` 同时服务前端表单、列表字段、CSV 字段和数据库列初始化。
4. `app/shared/validation.ts` 同时服务保存校验与整库校验。
5. SQLite 是权威数据源；CSV/xlsx 是交换格式，不改变 schema。

## 化合物结构

- `canonical_smiles` 是唯一保存的结构字段。
- Ketcher 画板可载入当前 SMILES、绘制结构并回填 SMILES。
- OCSR 使用 DECIMER 将图片识别为 SMILES；结果必须人工核对后保存。

## 打包资源

- `docs/**` 被打包到应用资源中；内置帮助页读取并渲染用户手册、数据模型和数据持久化说明。
- `app/backend/ocsr/**` 与 `build/ocsr-runtime` 被打包，用于免配置 OCSR。
- `Units` 表作为历史兼容内部表保留，但不在主导航和 CSV 交换中使用。
