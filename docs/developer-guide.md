# 开发说明

## 本地启动

1. 安装 Node.js。
2. 安装依赖：
   ```bash
   npm install
   ```
3. Windows 双击 `run.bat`，或手动运行：
   ```bash
   npm run dev
   npm run build:electron
   node_modules/.bin/electron.cmd .
   ```

`run.bat` 会启动 Vite、构建 Electron 主进程并打开桌面应用。

## OCSR / DECIMER 环境

源码开发时使用 Pixi 管理 OCSR Python 环境：

```bash
pixi install
pixi run ocsr-install
pixi run ocsr-check
```

打包前准备免配置运行时：

```bash
npm run ocsr:prepare-runtime
```

如果需要指定 Python，可设置 `ENZYME_PYTHON`。应用优先使用打包内 `ocsr-runtime`，其次使用 `.pixi/envs/ocsr/python.exe`。

## 常用命令

```bash
npm run test
npm run build
npm run build:electron
npm run package
```

## 维护约定

- 表结构、字段中文名、分组、受控词引用以 `app/shared/schema.ts` 为单一来源。
- 校验逻辑放在 `app/shared/validation.ts`。
- 前端不直接访问 SQLite 或文件系统，只通过 preload 暴露的 API。
- `canonical_smiles` 是化合物结构的唯一持久化字段；Ketcher 和 OCSR 只是录入辅助。
