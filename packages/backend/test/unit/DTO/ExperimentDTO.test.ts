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
});
