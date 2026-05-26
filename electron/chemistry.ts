import type { RDKitModule } from '@rdkit/rdkit';

const initRDKitModule = require('@rdkit/rdkit') as () => Promise<RDKitModule>;

let rdkitPromise: Promise<RDKitModule> | null = null;

async function rdkit(): Promise<RDKitModule> {
  rdkitPromise ??= initRDKitModule();
  return rdkitPromise;
}

const ATOMIC_SYMBOLS: Record<number, string> = {
  1: 'H', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 11: 'Na', 12: 'Mg',
  14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 19: 'K', 20: 'Ca', 26: 'Fe',
  29: 'Cu', 30: 'Zn', 35: 'Br', 53: 'I'
};

function formatFormula(counts: Record<string, number>): string {
  const order = ['C', 'H', ...Object.keys(counts).filter((symbol) => symbol !== 'C' && symbol !== 'H').sort()];
  return order
    .filter((symbol, index, array) => counts[symbol] && array.indexOf(symbol) === index)
    .map((symbol) => `${symbol}${counts[symbol] === 1 ? '' : counts[symbol]}`)
    .join('');
}

function formulaFromJson(json: string): string {
  const data = JSON.parse(json) as { molecules?: Array<{ atoms?: Array<{ z?: number; impHs?: number }> }> };
  const counts: Record<string, number> = {};
  for (const molecule of data.molecules ?? []) {
    for (const atom of molecule.atoms ?? []) {
      const symbol = ATOMIC_SYMBOLS[atom.z ?? 6] ?? `E${atom.z}`;
      counts[symbol] = (counts[symbol] ?? 0) + 1;
      const hydrogens = atom.impHs ?? 0;
      if (hydrogens) counts.H = (counts.H ?? 0) + hydrogens;
    }
  }
  return formatFormula(counts);
}

export async function describeSmiles(smiles: string): Promise<{ inchikey?: string; formula?: string; error?: string }> {
  const trimmed = smiles.trim();
  if (!trimmed) return { error: 'canonical_smiles 不能为空' };
  const RDKit = await rdkit();
  const mol = RDKit.get_mol(trimmed);
  if (!mol) return { error: 'SMILES 无效，无法解析为分子结构' };
  try {
    const inchi = mol.get_inchi();
    const inchikey = RDKit.get_inchikey_for_inchi(inchi);
    if (!inchikey) return { error: '无法由 SMILES 生成 InChIKey' };
    return { inchikey, formula: formulaFromJson(mol.get_json()) };
  } finally {
    mol.delete();
  }
}

export const inchikeyFromSmiles = describeSmiles;
