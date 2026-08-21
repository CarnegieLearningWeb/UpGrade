import {
  containsListValueSeparator,
  mergeUniqueListValues,
  parseSingleColumnCSV,
  splitListValues,
} from './list-values.utils';
import { serializeValuesAsCSV } from '../../shared/services/common-export-helpers.service';

describe('list values utilities', () => {
  describe('splitListValues', () => {
    it('splits pasted values on commas, tabs, and new lines', () => {
      expect(splitListValues('one, two\tthree\nfour\r\nfive')).toEqual(['one', 'two', 'three', 'four', 'five']);
    });

    it('trims values and drops empty entries', () => {
      expect(splitListValues(' one, ,\n two ')).toEqual(['one', 'two']);
    });
  });

  describe('containsListValueSeparator', () => {
    it('flags values that the add/import pipelines would split or reject', () => {
      expect(containsListValueSeparator('schoolA,schoolB')).toBe(true);
      expect(containsListValueSeparator('school\tA')).toBe(true);
      expect(containsListValueSeparator('school\nA')).toBe(true);
      expect(containsListValueSeparator('school-A_1')).toBe(false);
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
  });

  describe('parseSingleColumnCSV', () => {
    it('parses a single-column CSV without a header', () => {
      expect(parseSingleColumnCSV('one\ntwo\r\nthree')).toEqual(['one', 'two', 'three']);
    });

    it('parses quoted values, escaped quotes, commas, and embedded line breaks', () => {
      expect(parseSingleColumnCSV('one\n"say ""hello"""\n"school,one"\n"line\r\nbreak"')).toEqual([
        'one',
        'say "hello"',
        'school,one',
        'line\r\nbreak',
      ]);
    });

    it('round-trips CSV-quoted values produced by the exporter', () => {
      const values = ['plain', 'say "hello"', 'school,one', 'line\nbreak'];

      expect(parseSingleColumnCSV(serializeValuesAsCSV(values))).toEqual(values);
    });

    it('rejects empty and multi-column CSV files', () => {
      expect(() => parseSingleColumnCSV('')).toThrow('CSV file is empty');
      expect(() => parseSingleColumnCSV('one,two')).toThrow('CSV should contain only one column');
      expect(() => parseSingleColumnCSV('"one",two')).toThrow('CSV should contain only one column');
    });

    it('rejects malformed quoted values', () => {
      expect(() => parseSingleColumnCSV('"unterminated')).toThrow('CSV contains malformed quoting');
      expect(() => parseSingleColumnCSV('"one"two')).toThrow('CSV contains malformed quoting');
    });
  });
});
