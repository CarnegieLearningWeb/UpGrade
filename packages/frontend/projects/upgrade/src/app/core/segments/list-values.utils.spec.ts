import {
  containsListValueSeparator,
  mergeUniqueListValues,
  parseSingleColumnCSV,
  splitListValues,
} from './list-values.utils';

describe('list values utilities', () => {
  describe('splitListValues', () => {
    it('splits pasted values on commas and new lines while preserving internal whitespace', () => {
      expect(splitListValues('one, two   three\nhello    world\r\nfive')).toEqual([
        'one',
        'two   three',
        'hello    world',
        'five',
      ]);
    });

    it('trims values and drops empty entries', () => {
      expect(splitListValues(' one, ,\n two ')).toEqual(['one', 'two']);
    });
  });

  describe('containsListValueSeparator', () => {
    it('flags values that the add/import pipelines would split or reject', () => {
      expect(containsListValueSeparator('schoolA,schoolB')).toBe(true);
      expect(containsListValueSeparator('school\nA')).toBe(true);
      expect(containsListValueSeparator('school\tA')).toBe(true);
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
      expect(parseSingleColumnCSV('one\ntwo\r\nthree\rfour')).toEqual(['one', 'two', 'three', 'four']);
    });

    it('preserves duplicate rows for post-operation reporting', () => {
      expect(parseSingleColumnCSV('one\none\ntwo')).toEqual(['one', 'one', 'two']);
    });

    it('preserves internal whitespace', () => {
      expect(parseSingleColumnCSV('hello    world')).toEqual(['hello    world']);
    });

    it('rejects multiple columns', () => {
      expect(() => parseSingleColumnCSV('school,one')).toThrow('CSV should contain only one column');
    });

    it.each(['school\tone', '\tschool'])('rejects tab characters before normalizing values', (content) => {
      expect(() => parseSingleColumnCSV(content)).toThrow('CSV values cannot contain tabs');
    });

    it('rejects an empty CSV file', () => {
      expect(() => parseSingleColumnCSV('')).toThrow('CSV file is empty');
    });
  });
});
