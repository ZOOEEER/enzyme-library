const STANDARD_AMINO_ACIDS = new Set('ACDEFGHIKLMNPQRSTVWY'.split(''));

export interface AminoAcidParseResult {
  sequence: string;
  length: number;
  nonStandardLetters: string[];
}

export function parseAminoAcidInput(text: string): AminoAcidParseResult {
  const withoutHeaders = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('>'))
    .join('');
  const sequence = (withoutHeaders.match(/[A-Za-z]/g) ?? []).join('').toUpperCase();
  const nonStandardLetters = [...new Set(sequence.split('').filter((letter) => !STANDARD_AMINO_ACIDS.has(letter)))].sort();
  return { sequence, length: sequence.length, nonStandardLetters };
}
