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

/** Parses an RFC-style CSV while rejecting records that contain more than one field. */
export function parseSingleColumnCSV(content: string): string[] {
  const values: string[] = [];
  let value = '';
  let isQuoted = false;
  let hasClosedQuote = false;

  const addValue = (): void => {
    const normalizedValue = value.trim();
    if (normalizedValue) {
      values.push(normalizedValue);
    }
    value = '';
    hasClosedQuote = false;
  };

  for (let index = 0; index < content.length; index++) {
    const character = content[index];

    if (isQuoted) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          value += '"';
          index++;
        } else {
          isQuoted = false;
          hasClosedQuote = true;
        }
      } else {
        value += character;
      }
      continue;
    }

    if (hasClosedQuote) {
      if (character === ' ' || character === '\t') {
        continue;
      }
      if (character === ',') {
        throw new Error('CSV should contain only one column');
      }
      if (character !== '\r' && character !== '\n') {
        throw new Error('CSV contains malformed quoting');
      }
    } else if (character === '"' && !value.trim()) {
      value = '';
      isQuoted = true;
      continue;
    } else if (character === ',') {
      throw new Error('CSV should contain only one column');
    } else if (character !== '\r' && character !== '\n') {
      value += character;
      continue;
    }

    addValue();
    if (character === '\r' && content[index + 1] === '\n') {
      index++;
    }
  }

  if (isQuoted) {
    throw new Error('CSV contains malformed quoting');
  }

  if (value || hasClosedQuote) {
    addValue();
  }

  if (!values.length) {
    throw new Error('CSV file is empty');
  }

  return values;
}
