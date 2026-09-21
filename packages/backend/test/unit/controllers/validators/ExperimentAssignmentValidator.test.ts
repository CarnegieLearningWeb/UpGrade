import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExperimentAssignmentValidatorv6 } from '../../../../src/api/controllers/validators/ExperimentAssignmentValidator';

// These options mirror the global validation config applied in
// packages/backend/src/loaders/app/index.ts, which is what routing-controllers
// merges in for every `@Body({ validate: true })` parameter. Note: forbidNonWhitelisted
// is NOT set, so unknown properties are silently stripped rather than raising errors.
const WHITELIST_OPTIONS = { whitelist: true };

describe('ExperimentAssignmentValidatorv6', () => {
  describe('valid payload', () => {
    it('passes validation with only context provided', async () => {
      const body = { context: 'upgrade-internal' };

      const instance = plainToInstance(ExperimentAssignmentValidatorv6, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance.context).toBe('upgrade-internal');
    });
  });

  describe('field-level validation', () => {
    it('rejects when context is missing', async () => {
      const body = {};

      const instance = plainToInstance(ExperimentAssignmentValidatorv6, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'context',
            constraints: expect.objectContaining({ isNotEmpty: expect.any(String) }),
          }),
        ])
      );
    });

    it('rejects when context is not a string', async () => {
      const body = { context: 12345 };

      const instance = plainToInstance(ExperimentAssignmentValidatorv6, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'context',
            constraints: expect.objectContaining({ isString: expect.any(String) }),
          }),
        ])
      );
    });
  });

  describe('whitelist discarding of genuinely unknown properties (no forbidNonWhitelisted)', () => {
    it('silently discards unknown top-level properties without raising an error', async () => {
      const body = { context: 'upgrade-internal', bogusField: 'should not be allowed' };

      const instance = plainToInstance(ExperimentAssignmentValidatorv6, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance).not.toHaveProperty('bogusField');
      expect(instance.context).toBe('upgrade-internal');
    });
  });
});
