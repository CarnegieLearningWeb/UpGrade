import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ExperimentDTO } from '../../../src/api/DTO/ExperimentDTO';
import { ASSIGNMENT_UNIT, ASSIGNMENT_ALGORITHM } from 'upgrade_types';

describe('ExperimentDTO', () => {
  describe('assignmentAlgorithm / assignmentUnit compatibility', () => {
    it('rejects Thompson Sampling combined with Within-Subjects assignment', async () => {
      // Within-Subjects assignment never stores a condition on the individual enrollment (it's
      // tracked per-repeat via RepeatedEnrollment instead), which is what Thompson Sampling's
      // reward path reads to attribute a reward to a condition -- so this combination can never
      // record a reward and must be rejected up front.
      const dto = plainToInstance(ExperimentDTO, {
        assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
      });

      const errors = await validate(dto, { skipMissingProperties: true });

      expect(errors.some((e) => e.property === 'assignmentAlgorithm')).toBe(true);
    });

    it('allows Thompson Sampling with Individual assignment', async () => {
      const dto = plainToInstance(ExperimentDTO, {
        assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
      });

      const errors = await validate(dto, { skipMissingProperties: true });

      expect(errors.some((e) => e.property === 'assignmentAlgorithm')).toBe(false);
    });

    it('allows Within-Subjects assignment with a non-Thompson-Sampling algorithm', async () => {
      const dto = plainToInstance(ExperimentDTO, {
        assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      });

      const errors = await validate(dto, { skipMissingProperties: true });

      expect(errors.some((e) => e.property === 'assignmentAlgorithm')).toBe(false);
    });
  });

  describe('thompsonSamplingConfig.scalingFactor', () => {
    async function scalingFactorErrors(scalingFactor: unknown): Promise<string[]> {
      const dto = plainToInstance(ExperimentDTO, { thompsonSamplingConfig: { scalingFactor } });
      const errors = await validate(dto, { skipMissingProperties: true });
      const configErrors = errors.find((e) => e.property === 'thompsonSamplingConfig')?.children ?? [];
      return configErrors.filter((e) => e.property === 'scalingFactor').flatMap((e) => Object.keys(e.constraints));
    }

    it.each([0.01, 0.2, 1, 2.5, 10000, 1000000])('accepts %p', async (value) => {
      expect(await scalingFactorErrors(value)).toEqual([]);
    });

    it('rejects zero and negative values', async () => {
      expect(await scalingFactorErrors(0)).toContain('min');
      expect(await scalingFactorErrors(-1)).toContain('min');
    });

    // Same shared MAX_NUMBER_INPUT (1,000,000) cap as the other Thompson Sampling fields, and as the form.
    it('rejects values above 1,000,000', async () => {
      expect(await scalingFactorErrors(1000000.01)).toContain('max');
    });

    it('rejects more than two decimal places', async () => {
      expect(await scalingFactorErrors(0.125)).toContain('isNumber');
    });

    it('rejects NaN', async () => {
      expect(await scalingFactorErrors(NaN)).toContain('isNumber');
    });
  });
});
