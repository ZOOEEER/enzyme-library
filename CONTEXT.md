# Enzyme Library 酶库上下文

## 领域目标

酶库用于整理酶相关文献、专利和实验数据，重点保存酶、化合物、反应、条件、实验事实和工程突变效果之间的可追溯关系。

## 核心术语

- **主表**：定义可被复用的实体或词表，包括 `WT_Enzymes`、`Chemicals`、`Reactions`、`Conditions`、`References`、`Units`。
- **事实表**：记录具体实验事实，包括 `Enzyme_Substrate_Relations` 和 `Engineering`。
- **WT 酶/亲本酶**：保存在 `WT_Enzymes` 中的野生型或工程亲本酶；不保存具体 conversion、yield、ee、kcat、Km 等实验数值。
- **化合物**：保存在 `Chemicals` 中的底物、产物、胺供体、羰基前体、亚胺中间体、辅因子、溶剂等。
- **反应**：保存在 `Reactions` 中的具体化学转化；不包含 pH、温度、浓度、时间等实验条件。
- **实验条件**：保存在 `Conditions` 中的可复用条件集合；不保存 `reaction_id` 或 `reaction_type`。
- **WT 实验事实**：`Enzyme_Substrate_Relations` 中的一条记录，表示同一酶、同一反应、同一条件、同一指标集合下的实验结果。
- **酶工程事实**：`Engineering` 中的一条记录，表示突变体在特定反应和条件下相对亲本或基线事实的效果。
- **受控词**：`Controlled_Vocab` 中按列维护的预置词表；每一列是一套独立词表，被业务字段下拉引用。删除词项只影响后续选择，不自动改写历史数据。

## 建模原则

- 一行记录只表达一条实验事实。
- 如果条件、底物浓度、产物构型、检测方法或文献来源不同，应拆分为不同事实记录。
- 事实表不重复保存可通过 ID 关联得到的信息。
- `References` 是事实数据可追溯性的核心来源；DOI、URL、专利号只在该表集中维护。
- 单位明确的数值字段在字段名中体现单位；单位不统一的值使用 value + unit 成对字段。


## ????

- `WT_Enzymes.expression_purification_method` ??????/??/???????? `protein_form`???/?????????????????????????
