import { MigrationInterface, QueryRunner } from 'typeorm';

export class BootstrapThompsonSamplingConfigs1781395200000 implements MigrationInterface {
  name = 'BootstrapThompsonSamplingConfigs1781395200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ThompsonSamplingExperimentConfig rows for any thompson_sampling experiments
    // that don't have one yet (e.g. experiments converted from ts_configurable by the cleanup migration).
    await queryRunner.query(`
      INSERT INTO "thompson_sampling_experiment_config" ("experimentId", "versionNumber")
      SELECT e.id, 1
      FROM "experiment" e
      WHERE e."assignmentAlgorithm" = 'thompson_sampling'
        AND NOT EXISTS (
          SELECT 1 FROM "thompson_sampling_experiment_config" c WHERE c."experimentId" = e.id
        )
    `);

    // Create ConditionPosteriorState rows for each condition of those experiments.
    await queryRunner.query(`
      INSERT INTO "condition_posterior_state" ("configId", "conditionId", "priorSuccess", "priorFailure", "successCount", "totalCount", "versionNumber")
      SELECT c.id, ec.id, 1, 1, 0, 0, 1
      FROM "thompson_sampling_experiment_config" c
      JOIN "experiment_condition" ec ON ec."experimentId" = c."experimentId"
      WHERE NOT EXISTS (
        SELECT 1 FROM "condition_posterior_state" ps
        WHERE ps."configId" = c.id AND ps."conditionId" = ec.id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove posterior states and configs that were created by this migration.
    // We identify "bootstrapped" rows as those with no warmupThreshold/minimumDrawDifference/batchSize
    // (all nullable, all NULL means they came from this migration with defaults only).
    // This is a best-effort rollback — if configs were subsequently edited, those edits are lost.
    await queryRunner.query(`
      DELETE FROM "thompson_sampling_experiment_config"
      WHERE "warmupThreshold" IS NULL
        AND "minimumDrawDifference" IS NULL
        AND "batchSize" IS NULL
    `);
  }
}
