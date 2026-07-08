import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThompsonSamplingEntities1781222400000 implements MigrationInterface {
  name = 'ThompsonSamplingEntities1781222400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add thompson_sampling to the assignment algorithm enum
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'ts_configurable', 'thompson_sampling')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);

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

    // condition_posterior_state: per-condition Beta distribution state
    await queryRunner.query(
      `CREATE TABLE "condition_posterior_state" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "configId" uuid NOT NULL,
        "conditionId" uuid NOT NULL,
        "priorSuccess" double precision NOT NULL DEFAULT 1,
        "priorFailure" double precision NOT NULL DEFAULT 1,
        "successCount" integer NOT NULL DEFAULT 0,
        "totalCount" integer NOT NULL DEFAULT 0,
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

    // Remove thompson_sampling from the enum
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
