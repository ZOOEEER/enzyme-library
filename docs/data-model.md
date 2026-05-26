# 数据模型

## 主要数据表

- `References`：文献、专利或其它来源。
- `WT_Enzymes`：WT/亲本酶的来源、序列、构建与表达/制备背景。
- `Chemicals`：化合物、SMILES、分子式、InChIKey 和默认角色。
- `Reactions`：酶促化学转化。
- `Conditions`：可复用的批次实验条件。
- `Enzyme_Substrate_Relations`：WT/亲本酶实验事实。
- `Engineering`：突变体、突变组合和相对 WT 的工程结果。
- `Controlled_Vocab`：受控词和单位词表。

## 主键字段

主键用于唯一识别一条记录。新增记录时系统通常会自动生成编号；编辑已有记录时编号不可修改，避免引用关系混乱。

- `References.reference_id`：来源编号。
- `WT_Enzymes.enzyme_id`：酶编号。
- `Chemicals.compound_id`：化合物编号。
- `Reactions.reaction_id`：反应编号。
- `Conditions.condition_id`：条件编号。
- `Enzyme_Substrate_Relations.relation_id`：WT 实验事实编号。
- `Engineering.variant_id`：突变体编号。
- `Controlled_Vocab.id`：受控词记录编号。

## 表间引用关系

- 多数表通过 `reference_id` 指向 `References.reference_id`，用于追踪数据来源。
- `WT_Enzymes` 可通过 `reference_id` / `annotation_reference_id` 关联来源。
- `Chemicals` 可通过 `reference_id` 关联来源。
- `Reactions` 通过底物/产物字段引用 `Chemicals.compound_id`，并可通过 `reference_id` 关联来源。
- `Conditions` 通过 `reference_id` 关联来源。
- `Enzyme_Substrate_Relations` 引用 `WT_Enzymes.enzyme_id`、`Reactions.reaction_id`、`Conditions.condition_id` 和 `References.reference_id`。
- `Engineering` 引用 `WT_Enzymes.enzyme_id`、`Reactions.reaction_id`、`Conditions.condition_id`，可引用 `Enzyme_Substrate_Relations.relation_id` 作为基线，并通过 `reference_id` 关联来源。
- `Controlled_Vocab` 为下拉选项和校验提供词表，不作为实验事实外键主体。

实践建议：先录入被引用的基础数据，再录入实验事实；删除基础记录前先检查是否被引用，删除后运行 `整库校验`。

## 化合物结构录入

- `canonical_smiles` 是唯一保存的化合物结构字段。
- 可直接填写 SMILES；系统会生成 2D 预览、分子式和 InChIKey。
- 可使用 Ketcher 画板绘制结构，点击“使用结构”后回填 SMILES。
- 可载入结构图片进行 OCSR 识别；识别结果会回填为 SMILES 草稿，保存前必须人工核对。
- 图片识别依赖本机 Python / Pixi OCSR 环境；如不可用，请改用 SMILES / Ketcher 画板录入。
- 查找化学信息时，可参考以下资料源：
  - PubChem：https://pubchem.ncbi.nlm.nih.gov/
  - ChemicalBook：https://www.chemicalbook.com/

## 活性结果

活性和工程结果通常由以下信息组成：

- `mean`：平均值或代表值。
- `std`：标准差；不能单独填写。
- `unit`：单位。
- `raw_data`：原始重复测量值或原文数据。

填写了数值时，通常需要同时填写单位；相对 WT 倍数除外。

## Engineering 相对值

酶工程事实中的相对值支持两种填写方式：

- WT 指标值与突变体指标值成对填写；
- 或填写相对 WT 倍数。

WT/突变体指标值单位用于描述实际物理量；相对 WT 倍数是无单位 ratio。
