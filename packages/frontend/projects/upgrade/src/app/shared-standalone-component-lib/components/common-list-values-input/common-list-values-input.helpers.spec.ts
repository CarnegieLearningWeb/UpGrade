import { mergeUniqueListValues, parseSingleColumnCSV, splitListValues } from './common-list-values-input.helpers';

describe('common-list-values-input helpers', () => {
  describe('splitListValues', () => {
    it('splits comma, tab, and newline separated values while preserving order', () => {
      expect(splitListValues(' first,second\tthird\r\nfourth\n fifth ')).toEqual([
        'first',
        'second',
        'third',
        'fourth',
        'fifth',
      ]);
    });

    it('removes empty values', () => {
      expect(splitListValues('first, ,\nsecond')).toEqual(['first', 'second']);
    });
  });

  describe('mergeUniqueListValues', () => {
    it('appends unique values and reports duplicates from the list and incoming batch', () => {
      expect(mergeUniqueListValues(['first'], ['second', 'first', 'second', 'third'])).toEqual({
        values: ['first', 'second', 'third'],
        addedValues: ['second', 'third'],
        duplicateValues: ['first', 'second'],
      });
    });

    it('uses exact case-sensitive duplicate comparison', () => {
      expect(mergeUniqueListValues(['Value'], ['value']).values).toEqual(['Value', 'value']);
    });
  });

  describe('parseSingleColumnCSV', () => {
    it('parses one value per line', () => {
      expect(parseSingleColumnCSV('first\r\nsecond\nthird')).toEqual(['first', 'second', 'third']);
    });

    it('rejects empty files', () => {
      expect(() => parseSingleColumnCSV(' \n ')).toThrow('CSV file is empty');
    });

    it('rejects files containing multiple columns', () => {
      expect(() => parseSingleColumnCSV('first,second')).toThrow('CSV should contain only one column');
    });
  });
});
