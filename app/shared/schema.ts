export type TableName =
  | 'WT_Enzymes'
  | 'Chemicals'
  | 'Reactions'
  | 'Conditions'
  | 'Enzyme_Substrate_Relations'
  | 'Engineering'
  | 'References'
  | 'Controlled_Vocab'
  | 'Units';

export type FieldKind = 'text' | 'number' | 'date' | 'longtext';

export interface FieldSpec {
  name: string;
  label?: string;
  kind?: FieldKind;
  required?: boolean;
  recommended?: boolean;
  primary?: boolean;
  unique?: boolean;
  readonly?: boolean;
  core?: boolean;
  unit?: string;
  unitVocab?: string;
  references?: { table: TableName; field: string };
  multiReferences?: { table: TableName; field: string };
  vocab?: string;
  group?: string;
  help?: string;
  hidden?: boolean;
}

export interface TableSpec {
  name: TableName;
  title: string;
  description: string;
  fields: FieldSpec[];
  atLeastOne?: { fields: string[]; message: string };
}

export interface VocabEntry {
  vocabName: string;
  values: string[];
  usages: Array<{ table: TableName; field: string }>;
}

export interface TableGroup {
  title: string;
  tables: TableName[];
}

export const ACTIVITY_METRIC_UNIT_VOCABS: Record<string, string> = {
  conversion: 'percent_unit',
  yield: 'percent_unit',
  ee: 'percent_unit',
  de: 'percent_unit',
  residual_activity: 'percent_unit',
  product_titer: 'titer_unit',
  product_titer_g_L: 'titer_unit',
  specific_activity: 'specific_activity_unit',
  initial_rate: 'initial_rate_unit',
  TTN: 'TTN_unit',
  TOF: 'TOF_unit',
  kcat: 'kcat_unit',
  Km: 'concentration_unit',
  kcat_Km: 'kcat_Km_unit',
  Tm: 'temperature_unit',
  half_life: 'time_unit'
};

export const TABLE_GROUPS: TableGroup[] = [
  { title: '基础数据', tables: ['References', 'WT_Enzymes', 'Chemicals', 'Reactions', 'Conditions'] },
  { title: '活性数据', tables: ['Enzyme_Substrate_Relations', 'Engineering'] },
  { title: '辅助数据', tables: ['Controlled_Vocab'] }
];

export const AUTO_ID_PREFIXES: Partial<Record<TableName, string>> = {
  References: 'REF',
  WT_Enzymes: 'ENZ',
  Chemicals: 'CMP',
  Reactions: 'RXN',
  Conditions: 'COND',
  Enzyme_Substrate_Relations: 'REL',
  Engineering: 'VAR'
};

export const FIELD_LABELS: Record<string, string> = {
  curator: '整理人',
  curation_date: '整理日期',
  data_status: '数据状态',
  notes: '备注',
  enzyme_id: '酶编号',
  enzyme_name: '酶名称',
  alias: '别名',
  enzyme_type: '酶类型',
  enzyme_family: '酶家族',
  organism: '来源物种',
  tax_id: 'Taxonomy 编号',
  strain_or_isolate: '菌株或分离株',
  organism_source_type: '来源类型',
  uniprot_id: 'UniProt 编号',
  genbank_id: 'GenBank 编号',
  ncbi_accession: 'NCBI 登录号',
  pdb_id: 'PDB 编号',
  sequence_aa: '氨基酸序列',
  signal_peptide_removed: '是否去除信号肽',
  construct_tag: '构建标签',
  expression_host: '表达宿主',
  expression_purification_method: '表达纯化方法',
  cofactor_preference: '辅因子偏好',
  reported_reaction_scope: '报道反应范围',
  reported_stereo_scope: '报道立体选择性范围',
  activity_annotation_level: '活性注释级别',
  activity_annotation_basis: '活性注释依据',
  annotation_reference_id: '注释来源编号',
  reference_id: '来源编号',
  compound_id: '化合物编号',
  compound_name: '化合物名称',
  compound_role_default: '默认化合物角色',
  compound_class: '化合物类别',
  formula: '分子式',
  canonical_smiles: '规范 SMILES',
  inchikey: 'InChIKey',
  stereo_descriptor: '立体描述',
  stereo_descriptor_type: '立体描述类型',
  chirality_notes: '手性说明',
  racemate_or_single_enantiomer: '外消旋或单一对映体',
  salt_or_freebase: '盐型或游离碱',
  cas_number: 'CAS 号',
  pubchem_cid: 'PubChem CID',
  reaction_id: '反应编号',
  reaction_name: '反应名称',
  reaction_direction: '反应方向',
  main_substrate_id: '主底物编号',
  main_product_id: '主产物编号',
  secondary_substrate_id: '次要底物编号',
  secondary_product_id: '次要产物编号',
  reaction_equation_text: '反应方程文本',
  condition_id: '条件编号',
  condition_name: '条件名称',
  enzyme_form: '酶形式',
  enzyme_loading_value: '酶用量数值',
  enzyme_loading_unit: '酶用量单位',
  substrate_conc_mM: '底物浓度',
  amine_partner_conc_mM: '胺供体浓度',
  carbonyl_precursor_conc_mM: '羰基前体浓度',
  cofactor: '辅因子',
  cofactor_conc_mM: '辅因子浓度',
  cofactor_regeneration: '辅因子再生体系',
  regeneration_components: '再生体系组分',
  buffer: '缓冲液',
  pH: 'pH',
  pH_typical: 'pH',
  pH_min: 'pH \u4e0b\u9650',
  pH_max: 'pH \u4e0a\u9650',
  temperature_C: '温度',
  time_h: '反应时间',
  cosolvent: '助溶剂',
  cosolvent_percent: '助溶剂比例',
  salt_additives: '盐类添加剂',
  metal_ions: '金属离子',
  oxygen_condition: '氧气条件',
  reaction_scale_value: '反应规模数值',
  reaction_scale_unit: '反应规模单位',
  quench_method: '淬灭方法',
  workup: '后处理',
  other_chemical_additives_note: '\u5176\u4ed6\u5316\u5408\u7269\u6dfb\u52a0\u60c5\u51b5',
  condition_description: '\u5b9e\u9a8c\u6761\u4ef6\u6587\u672c\u63cf\u8ff0',
  relation_id: '事实编号',
  enzyme_id_ref: '酶编号',
  conversion_percent: '转化率',
  yield_percent: '收率',
  product_titer_g_L: '产物滴度',
  product_titer_mM: '产物滴度',
  specific_activity_U_mg: '比活力',
  original_activity_unit: '原始活性单位',
  kcat_s_1: 'kcat',
  Km_mM: 'Km',
  kcat_Km_M_1_s_1: 'kcat/Km',
  initial_rate_mM_min: '初速率',
  TTN_mol_mol: '总转化数',
  TOF_h_1: '转化频率',
  product_stereo_descriptor: '产物立体描述',
  ee_percent: '对映体过量',
  de_percent: '非对映体过量',
  selectivity_notes: '选择性说明',
  assay_type: '检测类型',
  analytical_method_details: '分析方法详情',
  replicates_n: '重复次数',
  error_type: '误差类型',
  error_value_same_unit_as_metric: '误差值',
  variant_id: '突变体编号',
  parent_enzyme_id: '亲本酶编号',
  variant_name: '突变体名称',
  mutation_set: '突变组合',
  mutation_count: '突变数量',
  design_method: '设计方法',
  library_type: '文库类型',
  screening_condition_id: '筛选条件编号',
  baseline_relation_id: '基线事实编号',
  effect_type: '效果类型',
  effect_summary: '效果总结',
  activity_metric: '活性指标',
  activity_value_standard_unit: '标准单位活性值',
  Tm_C: 'Tm',
  Tm_typical: 'Tm',
  Tm_min: 'Tm \u4e0b\u9650',
  Tm_max: 'Tm \u4e0a\u9650',
  half_life_h: '半衰期',
  expression_value: '表达量',
  original_expression_unit: '原始表达单位',
  WT_metric_value_standard_unit: 'WT 指标值',
  variant_metric_value_standard_unit: '突变体指标值',
  fold_change_vs_WT: '相对 WT 倍数',
  source: '来源类型',
  citation_or_note: '引用或说明',
  source_type: '来源类型词表',
  compound_role: '化合物角色',
  signal_peptide_removal_status: '\u4fe1\u53f7\u80bd\u53bb\u9664\u72b6\u6001',
  table_name: '表名',
  field_name: '字段名',
  default_unit: '默认单位',
  quantity_type: '物理量类型'
};

export const FIELD_HELPS: Record<string, string> = {
  main_substrate_id: '主要用于底物特异性、选择性和动力学常数计算。',
  main_product_id: '主要用于产物追踪、选择性和动力学常数计算。',
  canonical_smiles: '用于 2D 渲染、InChIKey 自动生成和查重。',
  inchikey: '由 canonical_smiles 自动生成，用于识别重复化合物。',
  kcat_s_1: '酶催化常数，表示单个活性位点每秒转换底物的次数。',
  Km_mM: '米氏常数，反映底物达到半最大速率时的浓度。',
  kcat_Km_M_1_s_1: '催化效率，注意 Km 需按 M 参与计算。',
  fold_change_vs_WT: '同一指标、同一条件下突变体相对 WT 的倍数。'
};



type NumericSpec = {
  base: string;
  label: string;
  group: string;
  unit?: string;
  unitVocab?: string;
  recommended?: boolean;
  core?: boolean;
  required?: boolean;
  help?: string;
};

type ResultSpec = {
  base: string;
  label: string;
  group: string;
  unitVocab: string;
  help?: string;
  core?: boolean;
};

function numericFields(specs: NumericSpec[]): FieldSpec[] {
  return specs.flatMap((spec) => {
    const unitField = `${spec.base}_unit`;
    const unitVocab = spec.unitVocab ?? unitField;
    return [
      { name: `${spec.base}_typical`, label: spec.label, group: spec.group, kind: 'number' as FieldKind, required: spec.required, recommended: spec.recommended, core: spec.core, help: spec.help },
      { name: `${spec.base}_min`, label: `${spec.label}\u4e0b\u9650`, group: spec.group, kind: 'number' as FieldKind },
      { name: `${spec.base}_max`, label: `${spec.label}\u4e0a\u9650`, group: spec.group, kind: 'number' as FieldKind },
      { name: unitField, label: `${spec.label}\u5355\u4f4d`, group: spec.group, vocab: unitVocab, recommended: spec.recommended }
    ];
  });
}

function resultFields(specs: ResultSpec[]): FieldSpec[] {
  return specs.flatMap((spec) => [
    { name: `${spec.base}_mean`, label: spec.label, group: spec.group, kind: 'number' as FieldKind, help: spec.help, core: spec.core },
    { name: `${spec.base}_std`, label: `${spec.label} SD`, group: spec.group, kind: 'number' as FieldKind, core: spec.core },
    { name: `${spec.base}_unit`, label: `${spec.label}\u5355\u4f4d`, group: spec.group, vocab: spec.unitVocab, core: spec.core },
    { name: `${spec.base}_raw_data`, label: `${spec.label} raw data`, group: spec.group, kind: 'longtext' as FieldKind, help: '\u539f\u59cb\u91cd\u590d\u503c\uff0c\u7528\u82f1\u6587\u9017\u53f7\u5206\u9694\uff1b\u7cfb\u7edf\u53ea\u4fdd\u5b58\uff0c\u4e0d\u81ea\u52a8\u8ba1\u7b97 mean/std\u3002', core: spec.core }
  ]);
}
function primaryHelp(name: string): string {
  return `${FIELD_LABELS[name] ?? name}；系统新增时自动分配，可手动修改但必须唯一。`;
}

const metaFields: FieldSpec[] = [
  { name: 'curator', group: '元数据', recommended: true },
  { name: 'curation_date', group: '元数据', kind: 'date', recommended: true },
  { name: 'data_status', group: '元数据', vocab: 'data_status', recommended: true },
  { name: 'notes', group: '元数据', kind: 'longtext' }
];

export const TABLES: TableSpec[] = [
  {
    name: 'WT_Enzymes',
    title: 'WT 酶/亲本酶',
    description: '\u8bb0\u5f55 WT/\u4eb2\u672c\u9176\u7684\u6765\u6e90\u3001\u5e8f\u5217\u3001\u6784\u5efa\u4e0e\u8868\u8fbe/\u5236\u5907\u80cc\u666f\uff0c\u4ee5\u53ca\u6982\u62ec\u6027\u6d3b\u6027\u6ce8\u91ca\u3002',
    atLeastOne: {
      fields: ['uniprot_id', 'genbank_id', 'ncbi_accession', 'pdb_id', 'sequence_aa'],
      message: 'UniProt / GenBank / NCBI / PDB / 氨基酸序列至少填写一个'
    },
    fields: [
      { name: 'enzyme_id', label: '酶编号', primary: true, required: true, core: true, group: '酶身份', help: '推荐格式 ENZ-0001 或项目自定义编号' },
      { name: 'enzyme_name', label: '酶名称', required: true, core: true, group: '酶身份' },
      { name: 'alias', label: '别名', group: '\u8eab\u4efd' },
      { name: 'enzyme_type', label: '\u9176\u7c7b\u578b', group: '\u9176\u8eab\u4efd', recommended: true, help: '\u586b\u5199\u9176\u7684\u5927\u7c7b\u6216\u529f\u80fd\u7c7b\u578b\uff0c\u4f8b\u5982\u8f6c\u6c28\u9176\u3001\u8131\u6c22\u9176\u3001\u6c27\u5316\u8fd8\u539f\u9176\u7b49\u3002' },
      { name: 'enzyme_family', label: '\u9176\u5bb6\u65cf', group: '\u9176\u8eab\u4efd', recommended: true, help: '\u586b\u5199\u66f4\u5177\u4f53\u7684\u5bb6\u65cf\u3001\u4e9a\u5bb6\u65cf\u6216\u6587\u732e\u4e2d\u4f7f\u7528\u7684\u5206\u7c7b\u540d\u79f0\uff1b\u4e0d\u786e\u5b9a\u53ef\u7559\u7a7a\u3002' },
      { name: 'organism', group: '\u6765\u6e90', recommended: true, help: '\u586b\u5199\u6765\u6e90\u7269\u79cd\u540d\u79f0\uff0c\u53ef\u7528\u5b66\u540d\u6216\u6587\u732e\u539f\u6587\u540d\u79f0\u3002' },
      { name: 'tax_id', group: '来源' },
      { name: 'strain_or_isolate', group: '\u6765\u6e90', help: '\u586b\u5199\u83cc\u682a\u3001\u5206\u79bb\u682a\u3001\u6837\u672c\u6216\u6784\u5efa\u6765\u6e90\u4fe1\u606f\u3002' },
      { name: 'organism_source_type', group: '来源', vocab: 'organism_source_type' },
      { name: 'uniprot_id', label: 'UniProt \u7f16\u53f7', group: '\u5e8f\u5217/\u7ed3\u6784', core: true },
      { name: 'genbank_id', label: 'GenBank \u7f16\u53f7', group: '\u5e8f\u5217/\u7ed3\u6784', core: true },
      { name: 'ncbi_accession', label: 'NCBI \u767b\u5f55\u53f7', group: '\u5e8f\u5217/\u7ed3\u6784', core: true },
      { name: 'pdb_id', label: 'PDB \u7f16\u53f7', group: '\u5e8f\u5217/\u7ed3\u6784', core: true },
      { name: 'sequence_aa', label: '\u6c28\u57fa\u9178\u5e8f\u5217', group: '\u5e8f\u5217/\u7ed3\u6784', kind: 'longtext', core: true, help: '\u53ef\u7c98\u8d34 FASTA \u6216\u7eaf\u5e8f\u5217\u6587\u672c\uff1b\u89e3\u6790\u540e\u5220\u9664 FASTA \u6807\u9898\u884c\u3001\u7a7a\u767d\u3001\u6570\u5b57\u548c\u683c\u5f0f\u7b26\u53f7\uff0c\u5e76\u7edf\u4e00\u8f6c\u4e3a\u5927\u5199\u5b57\u6bcd\u3002\u975e 20 \u79cd\u6807\u51c6\u6c28\u57fa\u9178\u5b57\u6bcd\u4f1a\u4fdd\u7559\u5e76\u7ed9\u51fa warning\uff0c\u4e0d\u963b\u65ad\u4fdd\u5b58\u3002' },
      { name: 'signal_peptide_removed', group: '\u5e8f\u5217/\u7ed3\u6784', vocab: 'signal_peptide_removal_status' },
      { name: 'construct_tag', group: '\u5e8f\u5217/\u7ed3\u6784', help: '\u586b\u5199 His-tag\u3001GST-tag\u3001\u622a\u77ed\u4f53\u3001\u878d\u5408\u6807\u7b7e\u7b49\u6784\u5efa\u4fe1\u606f\u3002' },
      { name: 'expression_host', group: '\u8868\u8fbe', help: '\u586b\u5199\u8868\u8fbe\u5bbf\u4e3b\u6216\u8868\u8fbe\u7cfb\u7edf\uff0c\u4f8b\u5982 E. coli BL21(DE3)\u3001\u9175\u6bcd\u3001\u54fa\u4e73\u7ec6\u80de\u7b49\uff1b\u53ea\u8bb0\u5f55\u5236\u5907\u80cc\u666f\uff0c\u4e0d\u8bb0\u5f55\u5b8c\u6574\u8868\u8fbe\u5b9e\u9a8c\u6761\u4ef6\u3002' },
      { name: 'expression_purification_method', group: '\u8868\u8fbe', kind: 'longtext', help: '\u586b\u5199\u9176\u6837\u54c1\u7684\u8868\u8fbe\u4e0e\u7eaf\u5316/\u5236\u5907\u65b9\u6cd5\u6458\u8981\uff0c\u4f8b\u5982\u5bbf\u4e3b\u4e0e\u8868\u8fbe\u7cfb\u7edf\u3001\u8bf1\u5bfc\u6216\u57f9\u517b\u6982\u51b5\u3001\u7eaf\u5316\u6b65\u9aa4\u3001\u662f\u5426\u4f7f\u7528\u7c97\u9176\u6db2/\u88c2\u89e3\u6db2/\u5168\u7ec6\u80de/\u56fa\u5b9a\u5316\u9176\u7b49\u3002\u8be5\u5b57\u6bb5\u7528\u4e8e\u6837\u54c1\u5236\u5907\u80cc\u666f\uff0c\u4e0d\u4f5c\u4e3a\u9176\u672c\u5f81\u6d3b\u6027\u53c2\u6570\u3002' },
      { name: 'cofactor_preference', group: '活性注释', vocab: 'cofactor' },
      { name: 'reported_reaction_scope', group: '活性注释', kind: 'longtext' },
      { name: 'reported_stereo_scope', group: '活性注释', kind: 'longtext' },
      { name: 'activity_annotation_level', group: '活性注释', vocab: 'activity_annotation_level' },
      { name: 'activity_annotation_basis', group: '活性注释', kind: 'longtext' },
      { name: 'annotation_reference_id', group: '活性注释', references: { table: 'References', field: 'reference_id' } },
      { name: 'reference_id', group: '元数据', references: { table: 'References', field: 'reference_id' } },
      ...metaFields
    ]
  },
  {
    name: 'Chemicals',
    title: '化合物',
    description: '记录底物、产物、辅因子、溶剂等化合物，支持 SMILES 2D 即时渲染。',
    fields: [
      { name: 'compound_id', label: '\u5316\u5408\u7269\u7f16\u53f7', primary: true, required: true, core: true, group: '\u8eab\u4efd', help: '\u5316\u5408\u7269\u7f16\u53f7\u53ef\u6309\u9ed8\u8ba4\u89d2\u8272\u7ef4\u62a4\u591a\u5957\u524d\u7f00\uff1a\u901a\u7528 CMP-0001\uff0c\u5e95\u7269 SUB-0001\uff0c\u4ea7\u7269 PRO-0001\uff0c\u8f85\u56e0\u5b50 COF-0001\uff0c\u6eb6\u5242 SOL-0001\u3002\u7cfb\u7edf\u53ef\u81ea\u52a8\u5206\u914d\uff0c\u4e5f\u53ef\u624b\u52a8\u4fee\u6539\uff0c\u4f46\u5fc5\u987b\u552f\u4e00\u3002' },
      { name: 'compound_name', label: '化合物名称', required: true, core: true, group: '\u8eab\u4efd' },
      { name: 'alias', label: '别名', group: '\u8eab\u4efd' },
      { name: 'compound_role_default', label: '默认角色', group: '\u8eab\u4efd', vocab: 'compound_role', recommended: true, core: true },
      { name: 'compound_class', label: '\u5316\u5b66\u7c7b\u522b', group: '\u7ed3\u6784', recommended: true, help: '\u586b\u5199\u5316\u5b66\u7ed3\u6784\u6216\u7269\u8d28\u7c7b\u522b\uff0c\u4f8b\u5982\u80fa\u3001\u916e\u3001\u919b\u3001\u9187\u3001\u7fa7\u9178\u3001\u6742\u73af\u3001\u82b3\u9999\u5316\u5408\u7269\u3001\u91d1\u5c5e\u76d0\u3001\u5c0f\u5206\u5b50\u8f85\u56e0\u5b50\u7b49\uff1b\u4e0d\u8981\u5728\u6b64\u586b\u5e95\u7269/\u4ea7\u7269\u8fd9\u7c7b\u4e1a\u52a1\u89d2\u8272\u3002' },
      { name: 'formula', group: '\u7ed3\u6784', readonly: true, help: '\u7531 canonical_smiles \u81ea\u52a8\u751f\u6210\uff0c\u4e0d\u9700\u8981\u624b\u52a8\u586b\u5199\u3002' },
      { name: 'canonical_smiles', label: '规范 SMILES', group: '\u7ed3\u6784', required: true, core: true, help: '用于 2D 渲染、InChIKey 自动生成和查重' },
      { name: 'inchikey', label: 'InChIKey', group: '\u7ed3\u6784', readonly: true, unique: true, core: true, help: '\u7531 canonical_smiles \u81ea\u52a8\u751f\u6210\uff0c\u4e0d\u53ef\u624b\u52a8\u586b\u5199\uff1b\u7528\u4e8e\u67e5\u91cd\u548c\u8bc6\u522b\u91cd\u590d\u5316\u5408\u7269\u3002' },
      { name: 'stereo_descriptor', group: '\u7acb\u4f53\u5316\u5b66', help: '\u586b\u5199\u5177\u4f53\u7acb\u4f53\u5316\u5b66\u63cf\u8ff0\uff0c\u4f8b\u5982 (R)/(S)\u3001E/Z\u3001cis/trans\u3001\u624b\u6027\u4e2d\u5fc3\u4f4d\u70b9\u6216\u6587\u732e\u4e2d\u7684\u539f\u59cb\u63cf\u8ff0\u3002' },
      { name: 'stereo_descriptor_type', group: '\u7acb\u4f53\u5316\u5b66', vocab: 'stereo_descriptor_type', help: '\u9009\u62e9\u7acb\u4f53\u63cf\u8ff0\u7684\u7c7b\u578b\uff0c\u5982 R/S\u3001E/Z\u3001cis/trans\u3001racemic\u3001achiral \u6216 other\u3002' },
      { name: 'chirality_notes', group: '\u7acb\u4f53\u5316\u5b66', kind: 'longtext', help: '\u586b\u5199\u624b\u6027\u548c\u7acb\u4f53\u5316\u5b66\u7684\u8865\u5145\u8bf4\u660e\uff0c\u5305\u62ec\u5916\u6d88\u65cb/\u5355\u4e00\u5bf9\u6620\u4f53/\u975e\u5bf9\u6620\u4f53\u6df7\u5408\u7269\u3001ee/de \u6216\u6587\u732e\u9009\u62e9\u6027\u63cf\u8ff0\u3001\u76d0\u578b/\u6e38\u79bb\u78b1/\u6c34\u5408\u7269/\u6eb6\u5242\u5316\u7269\u7b49\u65e0\u6cd5\u7ed3\u6784\u5316\u8868\u8fbe\u7684\u4fe1\u606f\u3002' },
      { name: 'racemate_or_single_enantiomer', group: '\u7acb\u4f53\u5316\u5b66', help: '\u586b\u5199\u8be5\u5316\u5408\u7269\u662f\u5916\u6d88\u65cb\u4f53\u3001\u5355\u4e00\u5bf9\u6620\u4f53\u3001\u975e\u5bf9\u6620\u4f53\u6df7\u5408\u7269\u6216\u4e0d\u660e\u3002', hidden: true },
      { name: 'salt_or_freebase', group: '\u7acb\u4f53\u5316\u5b66', help: '\u586b\u5199\u5316\u5408\u7269\u7684\u76d0\u578b\u6216\u6e38\u79bb\u78b1\u5f62\u5f0f\uff0c\u4f8b\u5982 hydrochloride\u3001sodium salt\u3001free base\u3002', hidden: true },
      { name: 'cas_number', group: '外部标识' },
      { name: 'pubchem_cid', group: '外部标识' },
      { name: 'reference_id', group: '元数据', references: { table: 'References', field: 'reference_id' } },
      ...metaFields
    ]
  },
  {
    name: 'Reactions',
    title: '反应',
    description: '\u5b9a\u4e49\u9176\u4fc3\u5316\u5b66\u8f6c\u5316\u3002',
    fields: [
      { name: 'reaction_id', label: '\u53cd\u5e94\u7f16\u53f7', primary: true, required: true, core: true, group: '\u57fa\u672c\u4fe1\u606f' },
      { name: 'reaction_name', label: '\u53cd\u5e94\u540d\u79f0', required: true, core: true, group: '\u57fa\u672c\u4fe1\u606f' },
      { name: 'reaction_direction', label: '\u53cd\u5e94\u65b9\u5411', group: '\u57fa\u672c\u4fe1\u606f', vocab: 'reaction_direction', recommended: true },
      { name: 'main_substrate_id', label: '\u4e3b\u5e95\u7269\u7f16\u53f7', group: '\u4e3b\u8981\u53cd\u5e94', references: { table: 'Chemicals', field: 'compound_id' }, required: true, core: true, help: '\u4e3b\u8981\u7528\u4e8e\u5e95\u7269\u7279\u5f02\u6027/\u9009\u62e9\u6027\u4e0e\u52a8\u529b\u5b66\u5e38\u6570\u8ba1\u7b97\u3002' },
      { name: 'main_product_id', label: '\u4e3b\u4ea7\u7269\u7f16\u53f7', group: '\u4e3b\u8981\u53cd\u5e94', references: { table: 'Chemicals', field: 'compound_id' }, required: true, core: true, help: '\u4e3b\u8981\u7528\u4e8e\u4ea7\u7269\u8ffd\u8e2a\u3001\u9009\u62e9\u6027\u4e0e\u52a8\u529b\u5b66\u5e38\u6570\u8ba1\u7b97\u3002' },
      { name: 'secondary_substrate_id', label: '\u65e7\u6b21\u8981\u5e95\u7269\u7f16\u53f7', references: { table: 'Chemicals', field: 'compound_id' }, hidden: true },
      { name: 'secondary_product_id', label: '\u65e7\u6b21\u8981\u4ea7\u7269\u7f16\u53f7', references: { table: 'Chemicals', field: 'compound_id' }, hidden: true },
      { name: 'secondary_substrate_ids', label: '\u6b21\u8981\u5e95\u7269', group: '\u9009\u62e9\u6027/\u4f34\u968f\u7ec4\u5206', multiReferences: { table: 'Chemicals', field: 'compound_id' }, help: '\u7528\u4e8e\u4ea7\u7269\u9009\u62e9\u6027\u3001\u7ade\u4e89\u5e95\u7269\u6216\u975e\u4e3b\u5206\u6790\u5bf9\u8c61\u7684\u5e95\u7269\uff1b\u53ef\u9009\u4e00\u4e2a\u6216\u591a\u4e2a\u5df2\u6709\u5316\u5408\u7269\u3002' },
      { name: 'secondary_product_ids', label: '\u6b21\u8981\u4ea7\u7269', group: '\u9009\u62e9\u6027/\u4f34\u968f\u7ec4\u5206', multiReferences: { table: 'Chemicals', field: 'compound_id' }, help: '\u7528\u4e8e\u526f\u4ea7\u7269\u3001\u9009\u62e9\u6027\u4ea7\u7269\u6216\u975e\u4e3b\u4ea7\u7269\uff1b\u53ef\u9009\u4e00\u4e2a\u6216\u591a\u4e2a\u5df2\u6709\u5316\u5408\u7269\u3002' },
      { name: 'co_substrate_ids', label: '\u5171\u5e95\u7269', group: '\u9009\u62e9\u6027/\u4f34\u968f\u7ec4\u5206', multiReferences: { table: 'Chemicals', field: 'compound_id' }, help: '\u7528\u4e8e\u8f85\u56e0\u5b50\u3001\u5c0f\u5206\u5b50\u4f9b\u4f53/\u53d7\u4f53\u3001\u5171\u540c\u53c2\u4e0e\u4f46\u4e0d\u662f\u4e3b\u5e95\u7269\u7684\u5316\u5408\u7269\u3002' },
      { name: 'co_product_ids', label: '\u5171\u4ea7\u7269', group: '\u9009\u62e9\u6027/\u4f34\u968f\u7ec4\u5206', multiReferences: { table: 'Chemicals', field: 'compound_id' }, help: '\u7528\u4e8e\u8f85\u56e0\u5b50\u518d\u751f\u4ea7\u7269\u3001\u5c0f\u5206\u5b50\u526f\u4ea7\u7269\u7b49\u5171\u540c\u751f\u6210\u7269\u3002' },
      { name: 'reaction_equation_auto', label: '\u81ea\u52a8\u53cd\u5e94\u5f0f', group: '\u53cd\u5e94\u65b9\u7a0b', kind: 'longtext', readonly: true, core: true, help: '\u7531\u4e3b\u5e95\u7269/\u4e3b\u4ea7\u7269\u3001\u6b21\u8981\u7ec4\u5206\u548c\u5171\u5e95\u7269/\u5171\u4ea7\u7269\u81ea\u52a8\u751f\u6210\uff0c\u4e0d\u8003\u8651\u5316\u5b66\u8ba1\u91cf\u6570\u3002' },
      { name: 'reaction_equation_text', label: '\u539f\u59cb\u53cd\u5e94\u6587\u672c', group: '\u53cd\u5e94\u65b9\u7a0b', kind: 'longtext', core: true, help: '\u81ea\u7531\u683c\u5f0f\u586b\u5199\u6587\u732e\u539f\u6587\u6216\u5b9e\u9a8c\u8bb0\u5f55\u4e2d\u7684 raw data \u53cd\u5e94\u5f0f\u3002' },
      { name: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u5143\u6570\u636e', references: { table: 'References', field: 'reference_id' } },
      ...metaFields
    ]
  },
  {
    name: 'Conditions',
    title: '\u5b9e\u9a8c\u6761\u4ef6',
    description: '\u5b9a\u4e49\u6279\u6b21\u5b9e\u9a8c\u6761\u4ef6\uff0c\u53ef\u590d\u7528\u4e8e\u4e0d\u540c\u9176/\u4e0d\u540c\u53cd\u5e94\u3002',
    fields: [
      { name: 'condition_id', label: '\u6761\u4ef6\u7f16\u53f7', group: '\u6761\u4ef6\u8eab\u4efd', primary: true, required: true, core: true },
      { name: 'condition_name', label: '\u6761\u4ef6\u540d\u79f0', group: '\u6761\u4ef6\u8eab\u4efd', required: true, core: true },
      { name: 'enzyme_form', label: '\u9176\u5f62\u5f0f', group: '\u9176', vocab: 'enzyme_form', required: true, recommended: true, help: '\u586b\u5199\u5b9e\u9a8c\u4e2d\u4f7f\u7528\u7684\u9176\u5f62\u5f0f\uff0c\u4f8b\u5982\u7eaf\u5316\u9176\u3001\u5168\u7ec6\u80de\u3001\u7ec6\u80de\u88c2\u89e3\u6db2\u6216\u56fa\u5b9a\u5316\u9176\u3002' },
      ...numericFields([
        { base: 'enzyme_loading', label: '\u9176\u7528\u91cf', group: '\u9176', unitVocab: 'enzyme_loading_unit', required: true, recommended: true }
      ]),
      ...numericFields([
        { base: 'substrate_conc', label: '\u5e95\u7269\u6d53\u5ea6', group: '\u5316\u5408\u7269', unitVocab: 'concentration_unit', required: true, recommended: true }
      ]),
      { name: 'cofactor', label: '\u8f85\u56e0\u5b50', group: '\u5316\u5408\u7269', vocab: 'cofactor', recommended: true },
      ...numericFields([
        { base: 'cofactor_conc', label: '\u8f85\u56e0\u5b50\u6d53\u5ea6', group: '\u5316\u5408\u7269', unitVocab: 'concentration_unit' }
      ]),
      { name: 'cofactor_regeneration', label: '\u8f85\u56e0\u5b50\u518d\u751f\u4f53\u7cfb', group: '\u5316\u5408\u7269', vocab: 'cofactor_regeneration' },
      { name: 'regeneration_components', label: '\u518d\u751f\u4f53\u7cfb\u7ec4\u5206', group: '\u5316\u5408\u7269', kind: 'longtext', help: '\u586b\u5199\u8f85\u56e0\u5b50\u518d\u751f\u4f53\u7cfb\u7684\u5177\u4f53\u7ec4\u5206\u548c\u7528\u91cf\u3002' },
      { name: 'cosolvent_name', label: '\u52a9\u6eb6\u5242', group: '\u5316\u5408\u7269', help: '\u586b\u5199\u52a9\u6eb6\u5242\u6216\u6709\u673a\u6eb6\u5242\u540d\u79f0\u3002' },
      ...numericFields([
        { base: 'cosolvent_amount', label: '\u52a9\u6eb6\u5242\u6dfb\u52a0\u91cf', group: '\u5316\u5408\u7269', unitVocab: 'cosolvent_amount_unit' }
      ]),
      { name: 'salt_additives', label: '\u76d0\u7c7b\u6dfb\u52a0\u5242', group: '\u5316\u5408\u7269', help: '\u586b\u5199\u989d\u5916\u76d0\u7c7b\u3001\u79bb\u5b50\u5f3a\u5ea6\u8c03\u8282\u5242\u6216\u5176\u5b83\u76d0\u6dfb\u52a0\u5242\u3002' },
      { name: 'metal_ions', label: '\u91d1\u5c5e\u79bb\u5b50', group: '\u5316\u5408\u7269', help: '\u586b\u5199\u91d1\u5c5e\u79bb\u5b50\u6216\u91d1\u5c5e\u76d0\u6dfb\u52a0\u60c5\u51b5\u3002' },
      { name: 'other_chemical_additives_note', label: '\u5176\u4ed6\u5316\u5408\u7269\u6dfb\u52a0\u60c5\u51b5', group: '\u5316\u5408\u7269', kind: 'longtext', help: '\u7528\u4e8e\u8bb0\u5f55\u65e0\u6cd5\u7ed3\u6784\u5316\u5230\u4e0a\u8ff0\u5b57\u6bb5\u7684\u5176\u4ed6\u5316\u5408\u7269\u6dfb\u52a0\u60c5\u51b5\u3002' },
      { name: 'buffer', label: '\u7f13\u51b2\u6db2', group: '\u53cd\u5e94\u6761\u4ef6', required: true, help: '\u586b\u5199\u7f13\u51b2\u6db2\u7c7b\u578b\u548c\u6d53\u5ea6\u3002' },
      ...numericFields([
        { base: 'pH', label: 'pH', group: '\u53cd\u5e94\u6761\u4ef6', unitVocab: 'pH_unit', required: true },
        { base: 'temperature', label: '\u6e29\u5ea6', group: '\u53cd\u5e94\u6761\u4ef6', unitVocab: 'temperature_unit', required: true, recommended: true },
        { base: 'time', label: '\u53cd\u5e94\u65f6\u95f4', group: '\u53cd\u5e94\u6761\u4ef6', unitVocab: 'time_unit', required: true, recommended: true }
      ]),
      { name: 'oxygen_condition', label: '\u6c27\u6c14\u6761\u4ef6', group: '\u53cd\u5e94\u6761\u4ef6', help: '\u586b\u5199\u6c27\u6c14\u6216\u6c14\u6c1b\u6761\u4ef6\u3002' },
      ...numericFields([
        { base: 'reaction_scale', label: '\u53cd\u5e94\u89c4\u6a21', group: '\u53cd\u5e94\u6761\u4ef6', unitVocab: 'reaction_scale_unit', required: true }
      ]),
      { name: 'quench_method', label: '\u6dec\u706d\u65b9\u6cd5', group: '\u53cd\u5e94\u5904\u7406', help: '\u586b\u5199\u7ec8\u6b62\u53cd\u5e94\u7684\u65b9\u5f0f\u3002' },
      { name: 'workup', label: '\u540e\u5904\u7406', group: '\u53cd\u5e94\u5904\u7406', kind: 'longtext', help: '\u586b\u5199\u53cd\u5e94\u540e\u5904\u7406\u6b65\u9aa4\u3002' },
      { name: 'condition_description', label: '\u5b9e\u9a8c\u6761\u4ef6\u6587\u672c\u63cf\u8ff0', group: '\u5b9e\u9a8c\u6761\u4ef6\u6587\u672c\u63cf\u8ff0', kind: 'longtext', help: '\u7528\u4e8e\u4fdd\u7559\u6587\u732e\u6216\u5b9e\u9a8c\u8bb0\u5f55\u4e2d\u7684\u539f\u59cb\u5b9e\u9a8c\u6761\u4ef6\u6587\u672c\u3002' },
      { name: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u5143\u6570\u636e', references: { table: 'References', field: 'reference_id' }, required: true },
      ...metaFields
    ]
  },
  {
    name: 'Enzyme_Substrate_Relations',
    title: '\u0057\u0054 \u5b9e\u9a8c\u4e8b\u5b9e',
    description: '\u0057\u0054 \u9176\u5728\u7279\u5b9a reaction_id + condition_id \u4e0b\u7684\u5b9e\u9a8c\u7ed3\u679c\u3002',
    fields: [
      { name: 'relation_id', label: '\u4e8b\u5b9e\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', primary: true, required: true, core: true },
      { name: 'enzyme_id', label: '\u9176\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', required: true, references: { table: 'WT_Enzymes', field: 'enzyme_id' }, core: true },
      { name: 'reaction_id', label: '\u53cd\u5e94\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', required: true, references: { table: 'Reactions', field: 'reaction_id' }, core: true },
      { name: 'condition_id', label: '\u6761\u4ef6\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', required: true, references: { table: 'Conditions', field: 'condition_id' }, core: true },
      ...resultFields([
        { base: 'conversion', label: '\u8f6c\u5316\u7387', group: '\u6d3b\u6027', unitVocab: 'percent_unit', core: true, help: '\u5e95\u7269\u8f6c\u5316\u4e3a\u4ea7\u7269\u7684\u6bd4\u4f8b\uff0c\u5e38\u7528 %\u3002' },
        { base: 'yield', label: '\u6536\u7387', group: '\u6d3b\u6027', unitVocab: 'percent_unit', help: '\u5206\u79bb\u6216\u5206\u6790\u6536\u7387\uff0c\u5e38\u7528 %\u3002' },
        { base: 'product_titer_g_L', label: '\u4ea7\u7269\u6ef4\u5ea6', group: '\u6d3b\u6027', unitVocab: 'titer_unit', help: '\u4ea7\u7269\u6ef4\u5ea6\uff0c\u53ef\u9009\u62e9 g/L\u3001mg/mL\u3001mM \u6216 \u00b5M \u7b49\u5355\u4f4d\u3002' },
        { base: 'specific_activity', label: '\u6bd4\u6d3b\u529b', group: '\u9176\u6d3b', unitVocab: 'specific_activity_unit', help: '\u5355\u4f4d\u86cb\u767d\u6216\u9176\u91cf\u7684\u6d3b\u6027\u3002' },
        { base: 'initial_rate', label: '\u521d\u901f\u7387', group: '\u9176\u6d3b', unitVocab: 'initial_rate_unit', help: '\u53cd\u5e94\u521d\u671f\u901f\u7387\u3002' },
        { base: 'TTN', label: '\u603b\u8f6c\u5316\u6570', group: '\u9176\u6d3b', unitVocab: 'TTN_unit', help: '\u603b\u8f6c\u5316\u6570\uff0c\u8868\u793a\u5355\u4f4d\u50ac\u5316\u5242\u5b8c\u6210\u7684\u8f6c\u5316\u6b21\u6570\u3002' },
        { base: 'TOF', label: '\u8f6c\u5316\u9891\u7387', group: '\u9176\u6d3b', unitVocab: 'TOF_unit', help: '\u5355\u4f4d\u65f6\u95f4\u7684\u8f6c\u5316\u9891\u7387\u3002' },
        { base: 'kcat', label: 'kcat', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'kcat_unit', help: '\u50ac\u5316\u5e38\u6570\uff0c\u63cf\u8ff0\u5355\u4e2a\u6d3b\u6027\u4f4d\u70b9\u7684\u8f6c\u5316\u9891\u7387\u3002' },
        { base: 'Km', label: 'Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'concentration_unit', help: '\u7c73\u6c0f\u5e38\u6570\uff0c\u5355\u4f4d\u901a\u5e38\u4e3a\u6d53\u5ea6\u3002' },
        { base: 'kcat_Km', label: 'kcat/Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'kcat_Km_unit', help: '\u50ac\u5316\u6548\u7387\u3002' },
        { base: 'ee', label: '\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', unitVocab: 'percent_unit', core: true, help: '\u5bf9\u6620\u4f53\u8fc7\u91cf\uff0c\u5e38\u7528 %\u3002' },
        { base: 'de', label: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', unitVocab: 'percent_unit', help: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf\uff0c\u5e38\u7528 %\u3002' },
        { base: 'Tm', label: 'Tm', group: '\u7a33\u5b9a\u6027', unitVocab: 'temperature_unit', help: '\u70ed\u7a33\u5b9a\u6027\u6307\u6807\uff0c\u4f8b\u5982\u7194\u89e3\u6e29\u5ea6\u6216\u70ed\u8f6c\u53d8\u6e29\u5ea6\u3002' },
        { base: 'half_life', label: '\u534a\u8870\u671f', group: '\u7a33\u5b9a\u6027', unitVocab: 'time_unit', help: '\u7279\u5b9a\u6761\u4ef6\u4e0b\u6d3b\u6027\u964d\u81f3\u4e00\u534a\u6240\u9700\u65f6\u95f4\u3002' },
        { base: 'residual_activity', label: '\u6b8b\u4f59\u6d3b\u6027', group: '\u7a33\u5b9a\u6027', unitVocab: 'percent_unit', help: '\u5904\u7406\u540e\u4fdd\u7559\u7684\u6d3b\u6027\u6bd4\u4f8b\uff0c\u5e38\u7528 %\u3002' }
      ]),
      { name: 'product_stereo_descriptor', label: '\u4ea7\u7269\u7acb\u4f53\u63cf\u8ff0', group: '\u9009\u62e9\u6027' },
      { name: 'selectivity_notes', label: '\u9009\u62e9\u6027\u8bf4\u660e', group: '\u9009\u62e9\u6027', kind: 'longtext' },
      { name: 'assay_type', label: '\u68c0\u6d4b\u7c7b\u578b', group: '\u5206\u6790\u4e0e\u8bef\u5dee', vocab: 'assay_type' },
      { name: 'analytical_method_details', label: '\u5206\u6790\u65b9\u6cd5\u8be6\u60c5', group: '\u5206\u6790\u4e0e\u8bef\u5dee', kind: 'longtext' },
      { name: 'replicates_n', label: '\u91cd\u590d\u6b21\u6570', group: '\u5206\u6790\u4e0e\u8bef\u5dee', kind: 'number' },
      { name: 'error_type', label: '\u8bef\u5dee\u7c7b\u578b', group: '\u5206\u6790\u4e0e\u8bef\u5dee', vocab: 'error_type', help: '\u9009\u62e9 mean \u9644\u5e26\u7684\u8bef\u5dee\u7c7b\u578b\uff0c\u4f8b\u5982 SD\u3001SEM\u3001CI \u6216 range\u3002' },
      { name: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u5143\u6570\u636e', required: true, references: { table: 'References', field: 'reference_id' } },
      ...metaFields
    ]
  },
  {
    name: 'Engineering',
    title: '\u9176\u5de5\u7a0b\u4e8b\u5b9e',
    description: '\u7a81\u53d8\u4f53\u5728\u7279\u5b9a\u53cd\u5e94\u548c\u6761\u4ef6\u4e0b\u76f8\u5bf9\u4eb2\u672c\u7684\u6548\u679c\u3002',
    fields: [
      { name: 'variant_id', label: '\u7a81\u53d8\u4f53\u7f16\u53f7', group: '\u7a81\u53d8\u4f53\u4fe1\u606f', primary: true, required: true, core: true },
      { name: 'parent_enzyme_id', label: '\u4eb2\u672c\u9176\u7f16\u53f7', group: '\u7a81\u53d8\u4f53\u4fe1\u606f', required: true, references: { table: 'WT_Enzymes', field: 'enzyme_id' }, core: true },
      { name: 'variant_name', label: '\u7a81\u53d8\u4f53\u540d\u79f0', group: '\u7a81\u53d8\u4f53\u4fe1\u606f', required: true, core: true },
      { name: 'mutation_set', label: '\u7a81\u53d8\u7ec4\u5408', group: '\u7a81\u53d8\u4f53\u4fe1\u606f', required: true, core: true, help: '\u7ea6\u5b9a\u683c\u5f0f\uff1aA123B\uff0c\u8868\u793a\u7b2c 123 \u4f4d\u7531 A \u7a81\u53d8\u4e3a B\uff1bA/B \u4e3a 20 \u79cd\u6807\u51c6\u6c28\u57fa\u9178\u5355\u5b57\u6bcd\u4ee3\u7801\u3002\u591a\u70b9\u7a81\u53d8\u7528 / \u5206\u9694\uff0c\u4f8b\u5982 A123B/C45D\u3002' },
      { name: 'mutation_count', label: '\u7a81\u53d8\u6570\u91cf', group: '\u7a81\u53d8\u4f53\u4fe1\u606f', kind: 'number' },
      { name: 'reaction_id', label: '\u53cd\u5e94\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', required: true, references: { table: 'Reactions', field: 'reaction_id' }, core: true },
      { name: 'screening_condition_id', label: '\u7b5b\u9009\u6761\u4ef6\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', required: true, references: { table: 'Conditions', field: 'condition_id' }, core: true },
      { name: 'baseline_relation_id', label: '\u57fa\u7ebf\u4e8b\u5b9e\u7f16\u53f7', group: '\u5b9e\u9a8c\u8bbe\u7f6e', references: { table: 'Enzyme_Substrate_Relations', field: 'relation_id' }, core: true },
      ...resultFields([
        { base: 'conversion', label: '\u8f6c\u5316\u7387', group: '\u6d3b\u6027', unitVocab: 'percent_unit', help: '\u5e95\u7269\u8f6c\u5316\u4e3a\u4ea7\u7269\u7684\u6bd4\u4f8b\uff0c\u5e38\u7528 %\u3002' },
        { base: 'yield', label: '\u6536\u7387', group: '\u6d3b\u6027', unitVocab: 'percent_unit', help: '\u5206\u79bb\u6216\u5206\u6790\u6536\u7387\uff0c\u5e38\u7528 %\u3002' },
        { base: 'product_titer_g_L', label: '\u4ea7\u7269\u6ef4\u5ea6', group: '\u6d3b\u6027', unitVocab: 'titer_unit', help: '\u4ea7\u7269\u6ef4\u5ea6\uff0c\u53ef\u9009\u62e9 g/L\u3001mg/mL\u3001mM \u6216 \u00b5M \u7b49\u5355\u4f4d\u3002' },
        { base: 'specific_activity', label: '\u6bd4\u6d3b\u529b', group: '\u9176\u6d3b', unitVocab: 'specific_activity_unit', help: '\u5355\u4f4d\u86cb\u767d\u6216\u9176\u91cf\u7684\u6d3b\u6027\u3002' },
        { base: 'initial_rate', label: '\u521d\u901f\u7387', group: '\u9176\u6d3b', unitVocab: 'initial_rate_unit', help: '\u53cd\u5e94\u521d\u671f\u901f\u7387\u3002' },
        { base: 'TTN', label: '\u603b\u8f6c\u5316\u6570', group: '\u9176\u6d3b', unitVocab: 'TTN_unit', help: '\u603b\u8f6c\u5316\u6570\uff0c\u8868\u793a\u5355\u4f4d\u50ac\u5316\u5242\u5b8c\u6210\u7684\u8f6c\u5316\u6b21\u6570\u3002' },
        { base: 'TOF', label: '\u8f6c\u5316\u9891\u7387', group: '\u9176\u6d3b', unitVocab: 'TOF_unit', help: '\u5355\u4f4d\u65f6\u95f4\u7684\u8f6c\u5316\u9891\u7387\u3002' },
        { base: 'kcat', label: 'kcat', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'kcat_unit', help: '\u50ac\u5316\u5e38\u6570\uff0c\u63cf\u8ff0\u5355\u4e2a\u6d3b\u6027\u4f4d\u70b9\u7684\u8f6c\u5316\u9891\u7387\u3002' },
        { base: 'Km', label: 'Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'concentration_unit', help: '\u7c73\u6c0f\u5e38\u6570\uff0c\u5355\u4f4d\u901a\u5e38\u4e3a\u6d53\u5ea6\u3002' },
        { base: 'kcat_Km', label: 'kcat/Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', unitVocab: 'kcat_Km_unit', help: '\u50ac\u5316\u6548\u7387\u3002' },
        { base: 'ee', label: '\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', unitVocab: 'percent_unit', help: '\u5bf9\u6620\u4f53\u8fc7\u91cf\uff0c\u5e38\u7528 %\u3002' },
        { base: 'de', label: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', unitVocab: 'percent_unit', help: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf\uff0c\u5e38\u7528 %\u3002' },
        { base: 'Tm', label: 'Tm', group: '\u7a33\u5b9a\u6027', unitVocab: 'temperature_unit', help: '\u70ed\u7a33\u5b9a\u6027\u6307\u6807\uff0c\u4f8b\u5982\u7194\u89e3\u6e29\u5ea6\u6216\u70ed\u8f6c\u53d8\u6e29\u5ea6\u3002' },
        { base: 'half_life', label: '\u534a\u8870\u671f', group: '\u7a33\u5b9a\u6027', unitVocab: 'time_unit', help: '\u7279\u5b9a\u6761\u4ef6\u4e0b\u6d3b\u6027\u964d\u81f3\u4e00\u534a\u6240\u9700\u65f6\u95f4\u3002' },
        { base: 'residual_activity', label: '\u6b8b\u4f59\u6d3b\u6027', group: '\u7a33\u5b9a\u6027', unitVocab: 'percent_unit', help: '\u5904\u7406\u540e\u4fdd\u7559\u7684\u6d3b\u6027\u6bd4\u4f8b\uff0c\u5e38\u7528 %\u3002' }
      ]),
      { name: 'assay_type', label: '\u68c0\u6d4b\u7c7b\u578b', group: '\u5206\u6790\u4e0e\u8bef\u5dee', vocab: 'assay_type' },
      { name: 'analytical_method_details', label: '\u5206\u6790\u65b9\u6cd5\u8be6\u60c5', group: '\u5206\u6790\u4e0e\u8bef\u5dee', kind: 'longtext' },
      { name: 'replicates_n', label: '\u91cd\u590d\u6b21\u6570', group: '\u5206\u6790\u4e0e\u8bef\u5dee', kind: 'number' },
      { name: 'error_type', label: '\u8bef\u5dee\u7c7b\u578b', group: '\u5206\u6790\u4e0e\u8bef\u5dee', vocab: 'error_type', help: '\u9009\u62e9 mean \u9644\u5e26\u7684\u8bef\u5dee\u7c7b\u578b\uff0c\u4f8b\u5982 SD\u3001SEM\u3001CI \u6216 range\u3002' },
      { name: 'activity_metric', label: '\u6307\u6807\u7c7b\u578b', group: '\u76f8\u5bf9\u503c', vocab: 'activity_metric', core: true },
      ...resultFields([
        { base: 'WT_metric_value', label: 'WT \u6307\u6807\u503c', group: '\u76f8\u5bf9\u503c', unitVocab: 'dimensionless_unit', core: true, help: 'WT \u4e0e\u7a81\u53d8\u4f53\u6307\u6807\u503c\u9700\u5728\u540c\u4e00\u6307\u6807\u3001\u540c\u4e00\u6761\u4ef6\u4e0b\u6210\u5bf9\u586b\u5199\uff0c\u6216\u6539\u586b\u76f8\u5bf9 WT \u500d\u6570\u3002' },
        { base: 'variant_metric_value', label: '\u7a81\u53d8\u4f53\u6307\u6807\u503c', group: '\u76f8\u5bf9\u503c', unitVocab: 'dimensionless_unit', core: true, help: 'WT \u4e0e\u7a81\u53d8\u4f53\u6307\u6807\u503c\u9700\u5728\u540c\u4e00\u6307\u6807\u3001\u540c\u4e00\u6761\u4ef6\u4e0b\u6210\u5bf9\u586b\u5199\uff0c\u6216\u6539\u586b\u76f8\u5bf9 WT \u500d\u6570\u3002' },
        { base: 'fold_change', label: '\u76f8\u5bf9 WT \u500d\u6570', group: '\u76f8\u5bf9\u503c', unitVocab: 'fold_unit', core: true, help: '\u7a81\u53d8\u4f53\u76f8\u5bf9 WT \u7684\u500d\u6570\uff0c\u65e0\u5355\u4f4d\uff1b\u53ef\u66ff\u4ee3 WT/\u7a81\u53d8\u4f53\u539f\u59cb\u6307\u6807\u503c\u3002' }
      ]).map((field) => field.name === 'fold_change_unit' ? { ...field, hidden: true } : field),
      { name: 'effect_type', label: '\u6548\u679c\u7c7b\u578b', group: '\u9176\u5de5\u7a0b\u6548\u679c', vocab: 'effect_type', recommended: true },
      { name: 'effect_summary', label: '\u6548\u679c\u603b\u7ed3', group: '\u9176\u5de5\u7a0b\u6548\u679c', kind: 'longtext' },
      { name: 'design_method', label: '\u8bbe\u8ba1\u65b9\u6cd5', group: '\u9176\u5de5\u7a0b\u6548\u679c' },
      { name: 'library_type', label: '\u6587\u5e93\u7c7b\u578b', group: '\u9176\u5de5\u7a0b\u6548\u679c' },
      { name: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u5143\u6570\u636e', required: true, references: { table: 'References', field: 'reference_id' } },
      ...metaFields
    ]
  },
  {
    name: 'References',
    title: '\u6587\u732e\u4e0e\u6765\u6e90',
    description: '\u5b9e\u9a8c\u3001\u6587\u732e\u3001\u4e13\u5229\u6216\u6570\u636e\u5e93\u6765\u6e90\u7684\u7b80\u5316\u8bb0\u5f55\u3002',
    fields: [
      { name: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', primary: true, required: true, core: true, group: '\u6765\u6e90\u4fe1\u606f', help: '\u6765\u6e90\u7f16\u53f7\uff1b\u7cfb\u7edf\u65b0\u589e\u65f6\u81ea\u52a8\u5206\u914d\uff0c\u53ef\u624b\u52a8\u4fee\u6539\u4f46\u5fc5\u987b\u552f\u4e00\u3002' },
      { name: 'source', label: '\u6765\u6e90\u7c7b\u578b', required: true, core: true, group: '\u6765\u6e90\u4fe1\u606f', vocab: 'source_type', help: '\u6765\u6e90\u7c7b\u578b\uff0c\u4f8b\u5982\u5b9e\u9a8c\u3001\u6587\u732e\u3001\u4e13\u5229\u3001\u6570\u636e\u5e93\u3002' },
      { name: 'citation_or_note', label: '\u5f15\u7528\u6216\u8bf4\u660e', required: true, core: true, group: '\u6765\u6e90\u4fe1\u606f', kind: 'longtext', help: '\u6587\u732e\u586b\u5199\u5f15\u7528\u4fe1\u606f\uff1b\u5b9e\u9a8c\u586b\u5199\u5b9e\u9a8c\u60c5\u51b5\u4ecb\u7ecd\u3002' },
      { name: 'doi_or_url', label: 'DOI/URL', group: '\u6765\u6e90\u4fe1\u606f', help: '\u586b\u5199 DOI\u3001\u6587\u7ae0\u94fe\u63a5\u3001\u4e13\u5229\u94fe\u63a5\u6216\u6570\u636e\u5e93\u8bb0\u5f55 URL\u3002' },
      { name: 'curator', group: '\u5143\u4fe1\u606f' },
      { name: 'curation_date', group: '\u5143\u4fe1\u606f', kind: 'date' },
      { name: 'data_status', group: '\u5143\u4fe1\u606f', vocab: 'data_status' },
      { name: 'notes', group: '\u5143\u4fe1\u606f', kind: 'longtext' }
    ]
  },
  {
    name: 'Controlled_Vocab',
    title: '受控词',
    description: '为下拉选项和校验 warning 提供预置词表。',
    fields: [
      { name: 'id', primary: true },
      { name: 'effect_type' },
      { name: 'cofactor' },
      { name: 'cofactor_regeneration' },
      { name: 'stereo_descriptor_type' },
      { name: 'organism_source_type' },
        { name: 'assay_type' },
        { name: 'error_type' },
        { name: 'data_status' },
      { name: 'activity_metric' },
      { name: 'source_type' },
      { name: 'compound_role' },
      { name: 'enzyme_form' },
      { name: 'reaction_direction' },
      { name: 'signal_peptide_removal_status' },
      { name: 'activity_annotation_level' },
        { name: 'concentration_unit' },
        { name: 'percent_unit' },
        { name: 'cosolvent_amount_unit' },
        { name: 'pH_unit' },
      { name: 'temperature_unit' },
      { name: 'time_unit' },
      { name: 'enzyme_loading_unit' },
      { name: 'reaction_scale_unit' },
      { name: 'titer_unit' },
      { name: 'specific_activity_unit' },
      { name: 'kcat_unit' },
      { name: 'kcat_Km_unit' },
      { name: 'initial_rate_unit' },
      { name: 'TTN_unit' },
      { name: 'TOF_unit' },
      { name: 'fold_unit' },
      { name: 'dimensionless_unit' },
    ]
  },
  {
    name: 'Units',
    title: '单位说明',
    description: '集中说明字段默认单位和换算注意事项。',
    fields: [
      { name: 'id', primary: true },
      { name: 'table_name', required: true },
      { name: 'field_name', required: true },
      { name: 'default_unit', required: true },
      { name: 'quantity_type' },
      { name: 'notes', kind: 'longtext' }
    ]
  }
];

export const TABLE_ORDER = TABLES.map((table) => table.name);

export function tableSpec(name: TableName): TableSpec {
  const spec = TABLES.find((table) => table.name === name);
  if (!spec) throw new Error(`Unknown table: ${name}`);
  return spec;
}

export function primaryField(name: TableName): string {
  return tableSpec(name).fields.find((field) => field.primary)?.name ?? 'id';
}

export function autoIdPrefix(name: TableName): string | undefined {
  return AUTO_ID_PREFIXES[name];
}

export function fieldTitle(field: FieldSpec): string {
  const chinese = field.label ?? FIELD_LABELS[field.name] ?? humanizeFieldName(field.name);
  const base = `${chinese} / ${field.name}`;
  return field.unit ? `${base} (${field.unit})` : base;
}

export function fieldHelp(field: FieldSpec): string | undefined {
  if (field.primary && !field.help) return primaryHelp(field.name);
  return field.help ?? FIELD_HELPS[field.name];
}

function humanizeFieldName(name: string): string {
  return name.replace(/_/g, ' ');
}

export function vocabUsage(vocabName: string): Array<{ table: TableName; field: string }> {
  const usage: Array<{ table: TableName; field: string }> = [];
  for (const table of TABLES) {
    for (const field of table.fields) {
      if (field.vocab === vocabName) usage.push({ table: table.name, field: field.name });
    }
  }
  return usage;
}
