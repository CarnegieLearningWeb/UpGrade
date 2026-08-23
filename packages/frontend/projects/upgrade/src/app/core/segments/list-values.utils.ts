export interface MergeListValuesResult {
  values: string[];
  addedValues: string[];
  duplicateValues: string[];
}

const VALUE_SEPARATORS = /[,\t\r\n]+/;

export function splitListValues(rawValue: string): string[] {
  return rawValue
    .split(VALUE_SEPARATORS)
    .map((value) => value.trim())
    .filter(Boolean);
}

/** True when a single value contains characters that the add/import pipelines treat as separators. */
export function containsListValueSeparator(value: string): boolean {
  return VALUE_SEPARATORS.test(value);
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
  const values = content
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!values.length) {
    throw new Error('CSV file is empty');
  }

  if (values.some((value) => value.includes(','))) {
    throw new Error('CSV should contain only one column');
  }

  if (values.some((value) => value.includes('\t'))) {
    throw new Error('CSV values cannot contain tabs');
  }

  return values;
}
