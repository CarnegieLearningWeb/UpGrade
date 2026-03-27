import { AuditLogDiffHelperService, DiffRow } from './audit-log-diff.helper';

describe('AuditLogDiffHelperService', () => {
  let service: AuditLogDiffHelperService;

  beforeEach(() => {
    service = new AuditLogDiffHelperService();
  });

  // ─── hasDiff ────────────────────────────────────────────────────────────────

  describe('#hasDiff', () => {
    const testCases = [
      {
        whenCondition: 'logData has a top-level diff property',
        logData: { diff: '-old\n+new' },
        expected: true,
      },
      {
        whenCondition: 'logData has a list-scoped diff property',
        logData: { list: { diff: '-old\n+new' } },
        expected: true,
      },
      {
        whenCondition: 'logData has neither diff nor list.diff',
        logData: { experimentId: 'abc' },
        expected: false,
      },
      {
        whenCondition: 'logData is null',
        logData: null,
        expected: false,
      },
      {
        whenCondition: 'logData is undefined',
        logData: undefined,
        expected: false,
      },
    ];

    testCases.forEach(({ whenCondition, logData, expected }) => {
      it(`WHEN ${whenCondition}, THEN hasDiff returns ${expected}`, () => {
        expect(service.hasDiff(logData)).toBe(expected);
      });
    });
  });

  // ─── getDiffContent ──────────────────────────────────────────────────────────

  describe('#getDiffContent', () => {
    const testCases = [
      {
        whenCondition: 'logData has a top-level diff',
        logData: { diff: '-old\n+new' },
        expected: '-old\n+new',
      },
      {
        whenCondition: 'logData has a list-scoped diff',
        logData: { list: { diff: '-listOld\n+listNew' } },
        expected: '-listOld\n+listNew',
      },
      {
        whenCondition: 'logData has both top-level and list-scoped diffs',
        logData: { diff: '-top', list: { diff: '-list' } },
        expected: '-list',
        note: 'list-scoped diff takes precedence',
      },
      {
        whenCondition: 'logData has no diff',
        logData: { experimentId: 'abc' },
        expected: '',
      },
      {
        whenCondition: 'logData is null',
        logData: null,
        expected: '',
      },
    ];

    testCases.forEach(({ whenCondition, logData, expected, note }) => {
      const label = note
        ? `WHEN ${whenCondition}, THEN "${expected}" (${note})`
        : `WHEN ${whenCondition}, THEN "${expected}"`;
      it(label, () => {
        expect(service.getDiffContent(logData)).toBe(expected);
      });
    });
  });

  // ─── parseDiff ───────────────────────────────────────────────────────────────

  describe('#parseDiff', () => {
    describe('basic line types', () => {
      it('WHEN the diff has a removed line, THEN it appears on the left side as "removed"', () => {
        const raw = '-old value';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: undefined,
            leftContent: 'old value',
            rightContent: '',
            leftType: 'removed',
            rightType: 'empty',
          },
        ]);
      });

      it('WHEN the diff has an added line, THEN it appears on the right side as "added"', () => {
        const raw = '+new value';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: undefined,
            rightLineNum: 1,
            leftContent: '',
            rightContent: 'new value',
            leftType: 'empty',
            rightType: 'added',
          },
        ]);
      });

      it('WHEN the diff has a context line with a leading space, THEN it appears on both sides as "context"', () => {
        const raw = ' unchanged line';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'unchanged line',
            rightContent: 'unchanged line',
            leftType: 'context',
            rightType: 'context',
          },
        ]);
      });

      it('WHEN the diff has a blank line, THEN it is skipped and produces no row', () => {
        const raw = ' context\n\n context2';
        const rows = service.parseDiff(raw);

        expect(rows).toHaveLength(2);
      });
    });

    describe('pairing removed and added lines', () => {
      it('WHEN a single removed line is followed by a single added line, THEN they are paired into one row', () => {
        const raw = '-old value\n+new value';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'old value',
            rightContent: 'new value',
            leftType: 'removed',
            rightType: 'added',
          },
        ]);
      });

      it('WHEN two removed lines are followed by two added lines, THEN each pair is aligned in its own row', () => {
        const raw = '-line A\n-line B\n+line X\n+line Y';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'line A',
            rightContent: 'line X',
            leftType: 'removed',
            rightType: 'added',
          },
          {
            leftLineNum: 2,
            rightLineNum: 2,
            leftContent: 'line B',
            rightContent: 'line Y',
            leftType: 'removed',
            rightType: 'added',
          },
        ]);
      });

      it('WHEN there are more removed lines than added lines, THEN extra removed lines are padded with empty right cells', () => {
        const raw = '-line A\n-line B\n+line X';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'line A',
            rightContent: 'line X',
            leftType: 'removed',
            rightType: 'added',
          },
          {
            leftLineNum: 2,
            rightLineNum: undefined,
            leftContent: 'line B',
            rightContent: '',
            leftType: 'removed',
            rightType: 'empty',
          },
        ]);
      });

      it('WHEN there are more added lines than removed lines, THEN extra added lines are padded with empty left cells', () => {
        const raw = '-line A\n+line X\n+line Y';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'line A',
            rightContent: 'line X',
            leftType: 'removed',
            rightType: 'added',
          },
          {
            leftLineNum: undefined,
            rightLineNum: 2,
            leftContent: '',
            rightContent: 'line Y',
            leftType: 'empty',
            rightType: 'added',
          },
        ]);
      });
    });

    describe('mixed diffs with context lines', () => {
      it('WHEN a change is surrounded by context lines, THEN each section is correctly classified', () => {
        const raw = ' context before\n-old\n+new\n context after';
        const rows = service.parseDiff(raw);

        expect(rows).toEqual<DiffRow[]>([
          {
            leftLineNum: 1,
            rightLineNum: 1,
            leftContent: 'context before',
            rightContent: 'context before',
            leftType: 'context',
            rightType: 'context',
          },
          {
            leftLineNum: 2,
            rightLineNum: 2,
            leftContent: 'old',
            rightContent: 'new',
            leftType: 'removed',
            rightType: 'added',
          },
          {
            leftLineNum: 3,
            rightLineNum: 3,
            leftContent: 'context after',
            rightContent: 'context after',
            leftType: 'context',
            rightType: 'context',
          },
        ]);
      });

      it('WHEN there are two separate change blocks separated by context, THEN each block is paired independently', () => {
        const raw = '-block1 old\n+block1 new\n context line\n-block2 old\n+block2 new';
        const rows = service.parseDiff(raw);

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ leftType: 'removed', rightType: 'added', leftContent: 'block1 old' });
        expect(rows[1]).toMatchObject({ leftType: 'context', leftContent: 'context line' });
        expect(rows[2]).toMatchObject({ leftType: 'removed', rightType: 'added', leftContent: 'block2 old' });
      });

      it('WHEN the diff ends with a pending change block (no trailing context), THEN the buffer is flushed and all rows are included', () => {
        const raw = ' context\n-trailing old\n+trailing new';
        const rows = service.parseDiff(raw);

        expect(rows).toHaveLength(2);
        expect(rows[1]).toMatchObject({ leftType: 'removed', rightType: 'added', leftContent: 'trailing old' });
      });
    });

    describe('line number tracking', () => {
      it('WHEN the diff has context and change lines, THEN line numbers increment correctly on each side', () => {
        const raw = ' ctx\n-removed\n+added\n ctx2';
        const rows = service.parseDiff(raw);

        expect(rows[0].leftLineNum).toBe(1); // context
        expect(rows[0].rightLineNum).toBe(1);
        expect(rows[1].leftLineNum).toBe(2); // removed/added pair
        expect(rows[1].rightLineNum).toBe(2);
        expect(rows[2].leftLineNum).toBe(3); // context
        expect(rows[2].rightLineNum).toBe(3);
      });
    });

    describe('ANSI color code handling', () => {
      it('WHEN the diff contains ANSI color codes (as produced by json-diff), THEN they are stripped before parsing', () => {
        const raw = '\x1b[31m-old value\x1b[0m\n\x1b[32m+new value\x1b[0m';
        const rows = service.parseDiff(raw);

        expect(rows).toHaveLength(1);
        expect(rows[0].leftContent).toBe('old value');
        expect(rows[0].rightContent).toBe('new value');
      });
    });

    describe('edge cases', () => {
      it('WHEN the diff string is empty, THEN parseDiff returns an empty array', () => {
        expect(service.parseDiff('')).toEqual([]);
      });

      it('WHEN the diff has only context lines, THEN all lines appear as context rows', () => {
        const raw = ' line one\n line two';
        const rows = service.parseDiff(raw);

        expect(rows).toHaveLength(2);
        expect(rows.every((r) => r.leftType === 'context')).toBe(true);
      });
    });
  });
});
