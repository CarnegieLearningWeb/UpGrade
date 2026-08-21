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

    it('preserves duplicate rows for post-operation reporting', () => {
      expect(parseSingleColumnCSV('one\none\ntwo')).toEqual(['one', 'one', 'two']);
    });

    it('reports both CSV and existing-list duplicates when parsed rows are merged', () => {
      expect(mergeUniqueListValues(['one'], parseSingleColumnCSV('one\none\ntwo'))).toEqual({
        values: ['one', 'two'],
        addedValues: ['two'],
        duplicateValues: ['one', 'one'],
      });
    });

    it('parses quoted values and escaped quotes', () => {
      expect(parseSingleColumnCSV('one\n"say ""hello"""')).toEqual(['one', 'say "hello"']);
    });

    it('rejects separators inside quoted values', () => {
      expect(() => parseSingleColumnCSV('"school,one"')).toThrow(
        'CSV values cannot contain commas, tabs, or line breaks'
      );
      expect(() => parseSingleColumnCSV('"school\tone"')).toThrow(
        'CSV values cannot contain commas, tabs, or line breaks'
      );
      expect(() => parseSingleColumnCSV('"school\r\none"')).toThrow(
        'CSV values cannot contain commas, tabs, or line breaks'
      );
    });

    it('round-trips values produced by the CSV exporter', () => {
      const values = [
        'plain',
        'say "hello"',
        '=SUM(A1:A2)',
        '+cmd',
        '-1+2',
        '@SUM(A1:A2)',
        '＝SUM(A1:A2)',
        "'=SUM(A1:A2)",
        "''=SUM(A1:A2)",
        "'school",
      ];

      expect(parseSingleColumnCSV(serializeValuesAsCSV(values))).toEqual(values);
    });

    it('decodes formula escapes without removing genuine leading apostrophes', () => {
      expect(parseSingleColumnCSV("'=SUM(A1:A2)\n''=SUM(A1:A2)\n'school")).toEqual([
        '=SUM(A1:A2)',
        "'=SUM(A1:A2)",
        "'school",
      ]);
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
