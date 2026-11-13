import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the Thompson Sampling scaling factor (α). Existing configs get 1, which leaves their
 * posteriors exactly as they were (prior + 1 × count).
 */
export class ThompsonSamplingScalingFactor1794510446000 implements MigrationInterface {
  name = 'ThompsonSamplingScalingFactor1794510446000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thompson_sampling_experiment_config" ADD "scalingFactor" double precision NOT NULL DEFAULT 1`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "thompson_sampling_experiment_config" DROP COLUMN "scalingFactor"`);
  }
}
