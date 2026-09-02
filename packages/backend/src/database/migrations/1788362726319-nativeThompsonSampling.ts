import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidates what was originally three (then four) separate migrations for the native Thompson
 * Sampling feature (thompsonSamplingEntities, cleanupMoocletEntities, bootstrapThompsonSamplingConfigs,
 * addPendingRewardCountsToConditionPosteriorState) into one. None of those had shipped to dev or been
 * applied to any real database — they only ever existed on this unmerged branch — so there was no
 * reason to keep them as separate steps; consolidating avoids interleaving with migrations that *have*
 * since been merged to dev (remove-twoCharacterId, featureFlagPrecomputedSegment,
 * experimentPrecomputedSegment), which this migration's timestamp is intentionally ordered after.
 */
export class NativeThompsonSampling1788362726319 implements MigrationInterface {
  name = 'NativeThompsonSampling1788362726319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Swap 'ts_configurable' for 'thompson_sampling' in the assignment algorithm enum. Existing rows
    // are remapped in the same USING expression that performs the type conversion, so there's no
    // intermediate enum state where both values coexist.
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'thompson_sampling')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum"
      USING (
        CASE "assignmentAlgorithm"::text
          WHEN 'ts_configurable' THEN 'thompson_sampling'
          ELSE "assignmentAlgorithm"::text
        END
      )::"public"."experiment_assignmentalgorithm_enum"
    `);
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);

    // Drop mooclet tables (cascade handles FK references)
    await queryRunner.query(`DROP TABLE IF EXISTS "mooclet_version_condition_map"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mooclet_experiment_ref"`);

    // thompson_sampling_experiment_config: one-to-one with experiment
    await queryRunner.query(
      `CREATE TABLE "thompson_sampling_experiment_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "experimentId" uuid,
        "warmupThreshold" integer,
        "minimumDrawDifference" double precision,
        "batchSize" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer NOT NULL,
        CONSTRAINT "UQ_ts_config_experimentId" UNIQUE ("experimentId"),
        CONSTRAINT "PK_ts_config" PRIMARY KEY ("id")
      )`
    );

    // condition_posterior_state: per-condition Beta distribution state. pendingSuccessCount/
    // pendingTotalCount buffer rewards between batch flushes (see ThompsonSamplingRewardService) —
    // included from the start since nothing has been applied anywhere yet.
    await queryRunner.query(
      `CREATE TABLE "condition_posterior_state" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "configId" uuid NOT NULL,
        "conditionId" uuid NOT NULL,
        "priorSuccess" double precision NOT NULL DEFAULT 1,
        "priorFailure" double precision NOT NULL DEFAULT 1,
        "successCount" integer NOT NULL DEFAULT 0,
        "failureCount" integer NOT NULL DEFAULT 0,
        "totalCount" integer NOT NULL DEFAULT 0,
        "pendingSuccessCount" integer NOT NULL DEFAULT 0,
        "pendingFailureCount" integer NOT NULL DEFAULT 0,
        "pendingTotalCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer NOT NULL,
        CONSTRAINT "UQ_posterior_config_condition" UNIQUE ("configId", "conditionId"),
        CONSTRAINT "PK_condition_posterior_state" PRIMARY KEY ("id")
      )`
    );

    // thompson_sampling_reward: raw reward events (audit trail + posterior recalculation)
    await queryRunner.query(
      `CREATE TABLE "thompson_sampling_reward" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "experimentId" uuid NOT NULL,
        "conditionId" uuid NOT NULL,
        "userId" character varying NOT NULL,
        "success" boolean NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer NOT NULL,
        CONSTRAINT "PK_ts_reward" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ts_reward_experiment_condition" ON "thompson_sampling_reward" ("experimentId", "conditionId")`
    );

    await queryRunner.query(
      `ALTER TABLE "thompson_sampling_experiment_config" ADD CONSTRAINT "FK_ts_config_experiment" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "condition_posterior_state" ADD CONSTRAINT "FK_posterior_state_config" FOREIGN KEY ("configId") REFERENCES "thompson_sampling_experiment_config"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "condition_posterior_state" ADD CONSTRAINT "FK_posterior_state_condition" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "thompson_sampling_reward" ADD CONSTRAINT "FK_ts_reward_experiment" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "thompson_sampling_reward" ADD CONSTRAINT "FK_ts_reward_condition" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Bootstrap config + posterior state rows for any experiment already flagged thompson_sampling
    // (including ones just remapped from ts_configurable above). Both tables are brand new in this
    // migration, so every such experiment necessarily lacks rows — no NOT EXISTS guard needed.
    await queryRunner.query(`
      INSERT INTO "thompson_sampling_experiment_config" ("experimentId", "versionNumber")
      SELECT e.id, 1
      FROM "experiment" e
      WHERE e."assignmentAlgorithm" = 'thompson_sampling'
    `);

    await queryRunner.query(`
      INSERT INTO "condition_posterior_state"
        ("configId", "conditionId", "priorSuccess", "priorFailure", "successCount", "failureCount", "totalCount", "pendingSuccessCount", "pendingFailureCount", "pendingTotalCount", "versionNumber")
      SELECT c.id, ec.id, 1, 1, 0, 0, 0, 0, 0, 0, 1
      FROM "thompson_sampling_experiment_config" c
      JOIN "experiment_condition" ec ON ec."experimentId" = c."experimentId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "thompson_sampling_reward" DROP CONSTRAINT "FK_ts_reward_condition"`);
    await queryRunner.query(`ALTER TABLE "thompson_sampling_reward" DROP CONSTRAINT "FK_ts_reward_experiment"`);
    await queryRunner.query(`ALTER TABLE "condition_posterior_state" DROP CONSTRAINT "FK_posterior_state_condition"`);
    await queryRunner.query(`ALTER TABLE "condition_posterior_state" DROP CONSTRAINT "FK_posterior_state_config"`);
    await queryRunner.query(
      `ALTER TABLE "thompson_sampling_experiment_config" DROP CONSTRAINT "FK_ts_config_experiment"`
    );

    await queryRunner.query(`DROP INDEX "IDX_ts_reward_experiment_condition"`);
    await queryRunner.query(`DROP TABLE "thompson_sampling_reward"`);
    await queryRunner.query(`DROP TABLE "condition_posterior_state"`);
    await queryRunner.query(`DROP TABLE "thompson_sampling_experiment_config"`);

    // Best-effort: the pre-migration enum has no 'thompson_sampling' value, so any experiment left in
    // that state would fail the column cast below. Fall back to 'random' — this is a rollback of a
    // feature that was never live, not a data-preserving downgrade.
    await queryRunner.query(
      `UPDATE "experiment" SET "assignmentAlgorithm" = 'random' WHERE "assignmentAlgorithm" = 'thompson_sampling'`
    );

    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'ts_configurable')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);
  }
}
