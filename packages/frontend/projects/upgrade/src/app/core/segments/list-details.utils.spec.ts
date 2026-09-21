import { LIST_FILTER_MODE } from 'upgrade_types';
import { parseListFilterMode } from './list-details.utils';

describe('list details utils', () => {
  describe('#parseListFilterMode', () => {
    it.each([
      ['inclusion', LIST_FILTER_MODE.INCLUSION],
      ['INCLUSION', LIST_FILTER_MODE.INCLUSION],
      ['exclusion', LIST_FILTER_MODE.EXCLUSION],
      ['EXCLUSION', LIST_FILTER_MODE.EXCLUSION],
    ])('should parse %s', (filterMode, expected) => {
      expect(parseListFilterMode(filterMode)).toBe(expected);
    });

    it.each([undefined, null, '', 'typo'])('should reject %s', (filterMode) => {
      expect(parseListFilterMode(filterMode)).toBeUndefined();
    });
  });
});
