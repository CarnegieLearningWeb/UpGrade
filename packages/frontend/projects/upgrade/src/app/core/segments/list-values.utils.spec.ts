import {
  MAX_LIST_VALUES,
  exceedsListValueLimit,
  mergeUniqueListValues,
  parseSingleColumnCSV,
  splitListValues,
} from './list-values.utils';

describe('list values utilities', () => {
  describe('splitListValues', () => {
    it('splits pasted values on commas, tabs, and new lines', () => {
      expect(splitListValues('one, two\tthree\nfour\r\nfive')).toEqual(['one', 'two', 'three', 'four', 'five']);
    });

    it('trims values and drops empty entries', () => {
      expect(splitListValues(' one, ,\n two ')).toEqual(['one', 'two']);
    });
  });

  describe('mergeUniqueListValues', () => {
    it('keeps existing order and reports duplicate values', () => {
      expect(mergeUniqueListValues(['one', 'two'], ['two', 'three', 'three'])).toEqual({
        values: ['one', 'two', 'three'],
        addedValues: ['three'],
        duplicateValues: ['two', 'three'],
      });
    });

    it('handles the 3,000-value WIP target', () => {
      const values = Array.from({ length: MAX_LIST_VALUES }, (_, index) => `value-${index}`);

      expect(mergeUniqueListValues([], values).values).toHaveLength(MAX_LIST_VALUES);
    });
  });

  describe('exceedsListValueLimit', () => {
    const existingValues = Array.from({ length: MAX_LIST_VALUES }, (_, index) => `value-${index}`);

    it('allows duplicate input when the list is already at the limit', () => {
      expect(exceedsListValueLimit(existingValues, ['value-0'])).toBe(false);
    });

    it('blocks a new value when the list is already at the limit', () => {
      expect(exceedsListValueLimit(existingValues, ['new-value'])).toBe(true);
    });
  });

  describe('parseSingleColumnCSV', () => {
    it('parses a single-column CSV without a header', () => {
      expect(parseSingleColumnCSV('one\ntwo\r\nthree')).toEqual(['one', 'two', 'three']);
    });

    it('rejects empty and multi-column CSV files', () => {
      expect(() => parseSingleColumnCSV('')).toThrow('CSV file is empty');
      expect(() => parseSingleColumnCSV('one,two')).toThrow('CSV should contain only one column');
    });
  });
});
