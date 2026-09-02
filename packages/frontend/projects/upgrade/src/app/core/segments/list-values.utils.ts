export interface MergeListValuesResult {
  values: string[];
  addedValues: string[];
  duplicateValues: string[];
}

const VALUE_SEPARATORS = /[,\r\n]+/;

export function containsTabCharacter(value: string): boolean {
  return value.includes('\t');
}

export function splitListValues(rawValue: string): string[] {
  return rawValue
    .split(VALUE_SEPARATORS)
    .map((value) => value.trim())
    .filter(Boolean);
}

/** True when a single value contains a delimiter or a tab that the backend cannot preserve. */
export function containsListValueSeparator(value: string): boolean {
  return VALUE_SEPARATORS.test(value) || containsTabCharacter(value);
}

export function mergeUniqueListValues(existingValues: string[], incomingValues: string[]): MergeListValuesResult {
  const seenValues = new Set(existingValues);
  const addedValues: string[] = [];
  const duplicateValues: string[] = [];

  incomingValues.forEach((value) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    if (seenValues.has(normalizedValue)) {
      duplicateValues.push(normalizedValue);
      return;
    }

    seenValues.add(normalizedValue);
    addedValues.push(normalizedValue);
  });

  return {
    values: [...existingValues, ...addedValues],
    addedValues,
    duplicateValues,
  };
}

export function parseSingleColumnCSV(content: string): string[] {
  if (containsTabCharacter(content)) throw new Error('CSV values cannot contain tabs');

  const lines = content
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) throw new Error('CSV file is empty');
  if (lines.some((line) => line.includes(','))) throw new Error('CSV should contain only one column');
  return lines;
}
