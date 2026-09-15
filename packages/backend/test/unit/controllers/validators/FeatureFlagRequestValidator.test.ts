import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  FeatureFlagRequestValidator,
  MAX_SUB_GROUPSETS,
} from '../../../../src/api/controllers/validators/FeatureFlagRequestValidator';

// These options mirror the global validation config applied in
// packages/backend/src/loaders/app/index.ts, which is what routing-controllers
// merges in for every `@Body({ validate: true })` parameter. Note: forbidNonWhitelisted
// is NOT set, so unknown properties are silently stripped rather than raising errors.
const WHITELIST_OPTIONS = { whitelist: true };

describe('FeatureFlagRequestValidator', () => {
  describe('normal mode (context only)', () => {
    it('passes with only context provided', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, { context: 'test-context' });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });
  });

  describe('deprecated top-level groupsForSession + includeStoredUserGroups', () => {
    it('passes when both are provided together', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        groupsForSession: { schoolId: ['demo-school'] },
        includeStoredUserGroups: false,
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it('fails when only groupsForSession is provided', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        groupsForSession: { schoolId: ['demo-school'] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'groupsForSession')).toBe(true);
    });

    it('fails when only includeStoredUserGroups is provided', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        includeStoredUserGroups: true,
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'includeStoredUserGroups')).toBe(true);
    });
  });

  describe('useSingleGroupSet', () => {
    it('passes with groups only — includeStoredUserGroups is optional', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useSingleGroupSet: { groups: { schoolId: ['demo-school'] } },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it('passes with groups and includeStoredUserGroups', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useSingleGroupSet: { groups: { schoolId: ['demo-school'] }, includeStoredUserGroups: true },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it('fails when groups is missing', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useSingleGroupSet: { includeStoredUserGroups: true },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useSingleGroupSet')).toBe(true);
    });

    it('fails when combined with the deprecated top-level fields', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useSingleGroupSet: { groups: { schoolId: ['demo-school'] } },
        groupsForSession: { schoolId: ['demo-school'] },
        includeStoredUserGroups: false,
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      const properties = errors.map((e) => e.property);
      expect(properties).toEqual(expect.arrayContaining(['useSingleGroupSet']));
    });

    it('fails when combined with useMultipleGroupSets', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useSingleGroupSet: { groups: { schoolId: ['demo-school'] } },
        useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'a', groups: { schoolId: ['a'] } }] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      const properties = errors.map((e) => e.property);
      expect(properties).toEqual(expect.arrayContaining(['useSingleGroupSet', 'useMultipleGroupSets']));
    });
  });

  describe('useMultipleGroupSets', () => {
    it('passes with subGroupsets only (no mainGroupset)', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: {
          subGroupsets: [
            { groupsetId: 'sectionA', groups: { schoolId: ['a'] } },
            { groupsetId: 'sectionB', groups: { schoolId: ['b'] }, includeStoredUserGroups: true },
          ],
        },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it('passes with a mainGroupset and subGroupsets', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: {
          mainGroupset: { groups: { schoolId: ['a', 'b'] } },
          subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }],
        },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it('fails when subGroupsets is missing', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: { mainGroupset: { groups: { schoolId: ['a'] } } },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useMultipleGroupSets')).toBe(true);
    });

    it('fails when subGroupsets is empty', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: { subGroupsets: [] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useMultipleGroupSets')).toBe(true);
    });

    it('fails when a subGroupsets entry is missing groupsetId', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: { subGroupsets: [{ groups: { schoolId: ['a'] } }] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useMultipleGroupSets')).toBe(true);
    });

    it('fails when a subGroupsets entry is missing groups', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'sectionA' }] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useMultipleGroupSets')).toBe(true);
    });

    it('fails when subGroupsets groupsetIds are not unique', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: {
          subGroupsets: [
            { groupsetId: 'dup', groups: { schoolId: ['a'] } },
            { groupsetId: 'dup', groups: { schoolId: ['b'] } },
          ],
        },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors.some((e) => e.property === 'useMultipleGroupSets')).toBe(true);
    });

    it(`passes with exactly ${MAX_SUB_GROUPSETS} subGroupsets entries`, async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: {
          subGroupsets: Array.from({ length: MAX_SUB_GROUPSETS }, (_, i) => ({
            groupsetId: `section${i}`,
            groups: { schoolId: [`s${i}`] },
          })),
        },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
    });

    it(`fails with more than ${MAX_SUB_GROUPSETS} subGroupsets entries, naming the actual count sent`, async () => {
      const count = MAX_SUB_GROUPSETS + 1;
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        useMultipleGroupSets: {
          subGroupsets: Array.from({ length: count }, (_, i) => ({
            groupsetId: `section${i}`,
            groups: { schoolId: [`s${i}`] },
          })),
        },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      const useMultipleGroupSetsError = errors.find((e) => e.property === 'useMultipleGroupSets');
      expect(useMultipleGroupSetsError).toBeDefined();
      const nestedConstraints = Object.values(useMultipleGroupSetsError.children?.[0]?.constraints ?? {});
      expect(nestedConstraints).toEqual(
        expect.arrayContaining([
          `Received ${count} subGroupsets, which exceeds the maximum of ${MAX_SUB_GROUPSETS} allowed`,
        ])
      );
    });

    it('fails when combined with the deprecated top-level fields', async () => {
      const instance = plainToInstance(FeatureFlagRequestValidator, {
        context: 'test-context',
        groupsForSession: { schoolId: ['a'] },
        includeStoredUserGroups: false,
        useMultipleGroupSets: { subGroupsets: [{ groupsetId: 'sectionA', groups: { schoolId: ['a'] } }] },
      });
      const errors = await validate(instance, WHITELIST_OPTIONS);

      const properties = errors.map((e) => e.property);
      expect(properties).toEqual(
        expect.arrayContaining(['groupsForSession', 'includeStoredUserGroups', 'useMultipleGroupSets'])
      );
    });
  });
});
