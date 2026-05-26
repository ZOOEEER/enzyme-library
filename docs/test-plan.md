# 测试计划

## 自动化测试

运行：

```bash
npm run test
npm run build
npm run build:electron
```

覆盖重点：

- schema 与 validation：必填、唯一、外键、受控词、Engineering 相对值、突变组合格式。
- CSV：当前表导出、全部导出、模板字段、隐藏字段排除、Units 排除。
- 序列：FASTA/TXT 解析、非标准氨基酸 warning。

## 手工验收

### 基础工作流

- 新增、编辑、删除 References / WT_Enzymes / Chemicals / Reactions / Conditions。
- 编辑已有记录时主键不可修改。
- 新增记录可复制已有记录，复制时保留新编号。

### 列表字段

- 基础表和活性表均可打开“列表字段”。
- 字段按全部字段分组显示，必填字段加粗。
- 列表字段配置刷新后仍保留。

### 化合物结构

- 手动输入 SMILES 后显示 2D preview，并生成 formula / InChIKey。
- Ketcher 画板可打开、载入当前结构、使用结构回填 SMILES。
- OCSR 环境缺失时给出明确提示，不清空已有 SMILES。
- 可选：完成 Pixi/DECIMER 后，用 `test/OCSR/C3H8O.png` 做真实识别。

### CSV / 数据交换

- 下载当前表 CSV 模板。
- 导入当前表 CSV 时按主键新增/更新，不清空整表。
- 导出当前 CSV 不受搜索和列表字段影响。
- 导出全部 CSV 不包含 `Units.csv`。

### 设置与校验

- 顶部“整库校验”弹出报告。
- 设置页显示 SQLite 路径。
- 备份和恢复数据库可用。

### 帮助页面

- 顶部 Electron 菜单不显示 `View` / `Help`。
- 左侧底部 `帮助` 页面显示 `用户手册`、`数据模型`、`数据持久化` 三类标签。
- 帮助文档在应用内部渲染，不打开外部浏览器或编辑器。
- Markdown 代码块正常显示，不出现裸露的 fence 标记。
- 用户手册无乱码，并按主界面、录入流程、数据录入、列表字段、记录操作、CSV、受控词、帮助组织。
- 用户手册的活性数据章节只保留 WT 实验事实和酶工程事实的简要用途说明。
- 数据模型包含主要数据表、主键字段、表间引用关系、化合物结构录入、活性结果和 Engineering 相对值。
- 数据模型中的 OCSR 说明提到 Python / Pixi 环境依赖。
- 数据持久化包含基本原则、CSV 交换、设置、备份与恢复。
- 帮助页右上角不显示 `导出全部 CSV`。

### 关于页面

- 左侧底部 `关于` 页面显示项目名、版本、GitHub 链接和授权摘要。
- 关于页说明供开发与内部使用，商用需授权。
- 关于页不显示 CSV 操作按钮。

## 待确认清理的测试资产

以下文件可能已过期，删除前需确认：

- `test/import/Units.csv`
- `test/template/Units.csv`
- `test/import/Enzyme_Substrate_Relations.csv`
- `test/output/Enzyme_Substrate_Relations.csv`
- `test/template/Enzyme_Substrate_Relations.csv`
- `test/db/ired-enzyme-library.sqlite`
- `test/test-0518.docx`
