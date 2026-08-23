import {
  containsListValueSeparator,
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

    it('treats quotation marks as value characters', () => {
      expect(parseSingleColumnCSV('"06df769b-740e-47f6-8548-2a52be1ab4be"\nsay "hello"\n"unterminated')).toEqual([
        '"06df769b-740e-47f6-8548-2a52be1ab4be"',
        'say "hello"',
        '"unterminated',
      ]);
    });

    it('preserves raw exported values when they are imported again', () => {
      const values = ['plain', '"abc"', 'say "hello"', '=SUM(A1:A2)', "'=SUM(A1:A2)"];

      expect(parseSingleColumnCSV(values.join('\n'))).toEqual(values);
    });

    it('rejects commas and tabs within values', () => {
      expect(() => parseSingleColumnCSV('school,one')).toThrow('CSV should contain only one column');
      expect(() => parseSingleColumnCSV('school\tone')).toThrow('CSV values cannot contain tabs');
    });

    it('preserves formula-like prefixes and leading apostrophes', () => {
      expect(
        parseSingleColumnCSV("=SUM(A1:A2)\n+cmd\n-1+2\n@SUM(A1:A2)\n'=SUM(A1:A2)\n''=SUM(A1:A2)\n'school")
      ).toEqual(['=SUM(A1:A2)', '+cmd', '-1+2', '@SUM(A1:A2)', "'=SUM(A1:A2)", "''=SUM(A1:A2)", "'school"]);
    });

    it('rejects empty and multi-column CSV files', () => {
      expect(() => parseSingleColumnCSV('')).toThrow('CSV file is empty');
      expect(() => parseSingleColumnCSV('one,two')).toThrow('CSV should contain only one column');
      expect(() => parseSingleColumnCSV('"one",two')).toThrow('CSV should contain only one column');
    });
  });
});
