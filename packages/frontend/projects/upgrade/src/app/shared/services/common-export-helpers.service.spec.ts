import { serializeValuesAsCSV } from './common-export-helpers.service';

describe('CommonExportHelpersService', () => {
  describe('serializeValuesAsCSV', () => {
    it('neutralizes values that spreadsheet applications could interpret as formulas', () => {
      expect(
        serializeValuesAsCSV([
          'plain',
          '=SUM(A1:A2)',
          '+cmd',
          '-1+2',
          '@SUM(A1:A2)',
          '\tformula',
          '\rformula',
          '\nformula',
          '＝SUM(A1:A2)',
        ])
      ).toBe(
        [
          '"plain"',
          '"\'=SUM(A1:A2)"',
          '"\'+cmd"',
          '"\'-1+2"',
          '"\'@SUM(A1:A2)"',
          '"\'\tformula"',
          '"\'\rformula"',
          '"\'\nformula"',
          '"\'＝SUM(A1:A2)"',
        ].join('\r\n')
      );
    });

    it('escapes CSV control characters and preserves genuine leading apostrophes', () => {
      expect(serializeValuesAsCSV(['plain', 'one,two', 'say "hello"', 'line\nbreak'])).toBe(
        ['"plain"', '"one,two"', '"say ""hello"""', '"line\nbreak"'].join('\r\n')
      );
      expect(serializeValuesAsCSV(["'=SUM(A1:A2)", "''=SUM(A1:A2)", "'school"])).toBe(
        ['"\'\'=SUM(A1:A2)"', "\"'''=SUM(A1:A2)\"", '"\'school"'].join('\r\n')
      );
    });
  });
});
