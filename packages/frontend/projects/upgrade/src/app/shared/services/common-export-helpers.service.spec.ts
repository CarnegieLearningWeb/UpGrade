import { serializeValuesAsCSV } from './common-export-helpers.service';

describe('CommonExportHelpersService', () => {
  describe('serializeValuesAsCSV', () => {
    it('neutralizes values that spreadsheet applications could interpret as formulas', () => {
      expect(
        serializeValuesAsCSV(['plain', '=SUM(A1:A2)', '+cmd', '-1+2', '@SUM(A1:A2)', '\tformula', '\rformula'])
      ).toBe(['plain', "'=SUM(A1:A2)", "'+cmd", "'-1+2", "'@SUM(A1:A2)", "'\tformula", '"\'\rformula"'].join('\n'));
    });

    it('escapes values that contain CSV control characters', () => {
      expect(serializeValuesAsCSV(['plain', 'one,two', 'say "hello"', 'line\nbreak'])).toBe(
        ['plain', '"one,two"', '"say ""hello"""', '"line\nbreak"'].join('\n')
      );
    });
  });
});
