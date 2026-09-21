import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RewardValidator } from '../../../../src/api/controllers/validators/RewardValidator';

// These options mirror the global validation config applied in
// packages/backend/src/loaders/app/index.ts, which is what routing-controllers
// merges in for every `@Body({ validate: true })` parameter. Note: forbidNonWhitelisted
// is NOT set, so unknown properties are silently stripped rather than raising errors.
const WHITELIST_OPTIONS = { whitelist: true };

describe('RewardValidator', () => {
  describe('decision point lookup mode (context + decisionPoint)', () => {
    it('does not strip context or decisionPoint under global whitelist validation', async () => {
      const body = {
        rewardValue: 'SUCCESS',
        context: 'upgrade-internal',
        decisionPoint: { site: 'fakesite', target: 'faketarget' },
      };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance.context).toBe('upgrade-internal');
      expect(instance.decisionPoint).toEqual({ site: 'fakesite', target: 'faketarget' });
    });

    it('defaults decisionPoint.target to an empty string when omitted, without dropping site', async () => {
      const body = {
        rewardValue: 'FAILURE',
        context: 'upgrade-internal',
        decisionPoint: { site: 'fakesite' },
      };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance.decisionPoint).toEqual({ site: 'fakesite', target: '' });
    });
  });

  describe('direct lookup mode (experimentId)', () => {
    it('passes validation with only experimentId provided', async () => {
      const body = { rewardValue: 'SUCCESS', experimentId: 'uuid-of-adaptive-experiment' };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance.experimentId).toBe('uuid-of-adaptive-experiment');
    });
  });

  describe('cross-field requirement', () => {
    it('rejects when neither experimentId nor (context and decisionPoint) are provided', async () => {
      const body = { rewardValue: 'SUCCESS' };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'experimentId',
            constraints: expect.objectContaining({
              customValidation: expect.stringContaining(
                'experimentId or secondary lookup details (context and decisionPoint) must be provided.'
              ),
            }),
          }),
        ])
      );
    });
  });

  describe('field-level validation', () => {
    it('rejects when rewardValue is missing', async () => {
      const body = { experimentId: 'uuid-of-adaptive-experiment' };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'rewardValue' })]));
    });

    it('rejects when rewardValue is not SUCCESS or FAILURE', async () => {
      const body = { rewardValue: 'NOT_A_REAL_VALUE', experimentId: 'uuid-of-adaptive-experiment' };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'rewardValue',
            constraints: expect.objectContaining({ isIn: expect.any(String) }),
          }),
        ])
      );
    });
  });

  describe('whitelist discarding of genuinely unknown properties (no forbidNonWhitelisted)', () => {
    it('silently discards unknown top-level properties without raising an error', async () => {
      const body = {
        rewardValue: 'SUCCESS',
        experimentId: 'uuid-of-adaptive-experiment',
        bogusField: 'should not be allowed',
      };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance).not.toHaveProperty('bogusField');
    });

    it('silently discards unknown nested properties on decisionPoint without raising an error', async () => {
      const body = {
        rewardValue: 'SUCCESS',
        context: 'upgrade-internal',
        decisionPoint: { site: 'fakesite', target: 'faketarget', bogusNested: 'should not be allowed' },
      };

      const instance = plainToInstance(RewardValidator, body);
      const errors = await validate(instance, WHITELIST_OPTIONS);

      expect(errors).toEqual([]);
      expect(instance.decisionPoint).not.toHaveProperty('bogusNested');
      expect(instance.decisionPoint).toEqual({ site: 'fakesite', target: 'faketarget' });
    });
  });
});
