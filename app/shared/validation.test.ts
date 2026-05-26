import { describe, expect, it } from 'vitest';
import { autoIdPrefix, fieldTitle, tableSpec, vocabUsage } from './schema';
import { validateDatabase, validateRow } from './validation';
import { parseAminoAcidInput } from './sequence';

describe('validation', () => {
  it('blocks missing required fields', () => {
    const issues = validateRow('References', { reference_id: '', source: '', citation_or_note: '' });
    expect(issues.some((issue) => issue.level === 'error' && issue.field === 'reference_id')).toBe(true);
    expect(issues.some((issue) => issue.level === 'error' && issue.field === 'citation_or_note')).toBe(true);
  });

  it('reports foreign key errors', () => {
    const issues = validateDatabase({
      Enzyme_Substrate_Relations: [
        { relation_id: 'REL-1', enzyme_id: 'NOPE', reaction_id: 'RXN-1', condition_id: 'COND-1', reference_id: 'REF-1' }
      ],
      Reactions: [{ reaction_id: 'RXN-1', reaction_type_code: 'TYPE', reaction_name: 'r' }],
      Conditions: [{ condition_id: 'COND-1', condition_name: 'c' }],
      References: [{ reference_id: 'REF-1', source: '文献', citation_or_note: 'ref' }]
    });
    expect(issues.some((issue) => issue.level === 'error' && issue.field === 'enzyme_id')).toBe(true);
  });

  it('does not validate recommended fields', () => {
    const issues = validateRow('Chemicals', { compound_id: 'CMP-1', compound_name: 'x' });
    expect(issues.some((issue) => issue.level === 'warning')).toBe(false);
  });

  it('requires one WT sequence or structure identifier', () => {
    const issues = validateRow('WT_Enzymes', { enzyme_id: 'ENZ-1', enzyme_name: 'enzyme' });
    expect(issues.some((issue) => issue.level === 'error' && issue.field?.includes('uniprot_id'))).toBe(true);
  });

  it('parses FASTA text and warns on non-standard amino acid letters', () => {
    expect(parseAminoAcidInput('>seq1\nac def-123')).toEqual({ sequence: 'ACDEF', length: 5, nonStandardLetters: [] });
    const issues = validateRow('WT_Enzymes', { enzyme_id: 'ENZ-1', enzyme_name: 'enzyme', sequence_aa: 'ACDUBZX' });
    expect(issues.some((issue) => issue.level === 'warning' && issue.field === 'sequence_aa')).toBe(true);
  });

  it('reports vocab usages from schema', () => {
    expect(vocabUsage('cofactor').some((usage) => usage.table === 'Conditions' && usage.field === 'cofactor')).toBe(true);
  });

  it('warns when existing data uses a deleted vocab value', () => {
    const issues = validateDatabase({
      Conditions: [{ condition_id: 'COND-1', condition_name: 'c', cofactor: 'DELETED_VALUE' }],
      Controlled_Vocab: [{ id: '1', cofactor: 'NADPH' }]
    });
    expect(issues.some((issue) => issue.level === 'warning' && issue.field === 'cofactor')).toBe(true);
  });

  it('renders bilingual field titles with Chinese labels first', () => {
    const chemicalClass = tableSpec('Chemicals').fields.find((field) => field.name === 'compound_class')!;
    const conversion = tableSpec('Enzyme_Substrate_Relations').fields.find((field) => field.name === 'conversion_mean')!;
    expect(fieldTitle(chemicalClass)).toBe('\u5316\u5b66\u7c7b\u522b / compound_class');
    expect(fieldTitle(conversion)).toBe('\u8f6c\u5316\u7387 / conversion_mean');
  });

  it('replaces WT protein_form with expression purification method', () => {
    const fields = tableSpec('WT_Enzymes').fields.map((field) => field.name);
    expect(fields).toContain('expression_purification_method');
    expect(fields).not.toContain('protein_form');
  });

  it('validates WT result mean/std/unit/raw data rules', () => {
    const base = { relation_id: 'REL-1', enzyme_id: 'ENZ-1', reaction_id: 'RXN-1', condition_id: 'COND-1', reference_id: 'REF-1' };
    expect(validateRow('Enzyme_Substrate_Relations', { ...base, conversion_mean: '80', conversion_unit: '%' }).some((issue) => issue.level === 'error' && issue.field?.startsWith('conversion'))).toBe(false);
    expect(validateRow('Enzyme_Substrate_Relations', { ...base, conversion_std: '2', conversion_unit: '%' }).some((issue) => issue.level === 'error' && issue.field === 'conversion_std')).toBe(true);
    expect(validateRow('Enzyme_Substrate_Relations', { ...base, conversion_mean: '80' }).some((issue) => issue.level === 'error' && issue.field === 'conversion_unit')).toBe(true);
    expect(validateRow('Enzyme_Substrate_Relations', { ...base, conversion_mean: '80', conversion_std: '-1', conversion_unit: '%' }).some((issue) => issue.level === 'error' && issue.field === 'conversion_std')).toBe(true);
    expect(validateRow('Enzyme_Substrate_Relations', { ...base, conversion_raw_data: '80,82,abc' }).some((issue) => issue.level === 'warning' && issue.field === 'conversion_raw_data')).toBe(true);
  });

  it('validates Engineering relative values without strict unit vocab checks', () => {
    const base = { variant_id: 'VAR-1', parent_enzyme_id: 'ENZ-1', variant_name: 'v', mutation_set: 'A123B', reaction_id: 'RXN-1', screening_condition_id: 'COND-1', reference_id: 'REF-1', activity_metric: 'conversion' };
    const paired = validateDatabase({ Engineering: [{ ...base, WT_metric_value_mean: '4', WT_metric_value_unit: '%', variant_metric_value_mean: '12', variant_metric_value_unit: '%' }], Controlled_Vocab: [{ id: '1', dimensionless_unit: 'x' }] });
    expect(paired.some((issue) => issue.field === 'WT_metric_value_unit' || issue.field === 'variant_metric_value_unit')).toBe(false);
    expect(validateRow('Engineering', { ...base, fold_change_mean: '3' }).some((issue) => issue.level === 'error' && issue.field === 'fold_change_unit')).toBe(false);
    expect(validateRow('Engineering', { ...base, WT_metric_value_mean: '4', WT_metric_value_unit: '%' }).some((issue) => issue.level === 'error' && issue.field === 'WT_metric_value_mean/variant_metric_value_mean')).toBe(true);
    expect(validateRow('Engineering', base).some((issue) => issue.level === 'error' && issue.field === 'fold_change_mean')).toBe(true);
  });

  it('requires Engineering mutation_set and warns on non-standard mutation format', () => {
    const base = { variant_id: 'VAR-1', parent_enzyme_id: 'ENZ-1', variant_name: 'v', reaction_id: 'RXN-1', screening_condition_id: 'COND-1', reference_id: 'REF-1', fold_change_mean: '2' };
    expect(validateRow('Engineering', base).some((issue) => issue.level === 'error' && issue.field === 'mutation_set')).toBe(true);
    expect(validateRow('Engineering', { ...base, mutation_set: 'A123B' }).some((issue) => issue.field === 'mutation_set')).toBe(false);
    expect(validateRow('Engineering', { ...base, mutation_set: 'A123B/C45D' }).some((issue) => issue.field === 'mutation_set')).toBe(false);
    expect(validateRow('Engineering', { ...base, mutation_set: 'A123U' }).some((issue) => issue.level === 'warning' && issue.field === 'mutation_set')).toBe(true);
    expect(validateRow('Engineering', { ...base, mutation_set: 'A123B, C45D' }).some((issue) => issue.level === 'warning' && issue.field === 'mutation_set')).toBe(true);
  });

  it('defines auto id prefixes for workflow data tables only', () => {
    expect(autoIdPrefix('Chemicals')).toBe('CMP');
    expect(autoIdPrefix('References')).toBe('REF');
    expect(autoIdPrefix('Enzyme_Substrate_Relations')).toBe('REL');
    expect(autoIdPrefix('Controlled_Vocab')).toBeUndefined();
  });
});
