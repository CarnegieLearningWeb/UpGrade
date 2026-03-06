import { MigrationInterface, QueryRunner } from 'typeorm';

export class RewardMetricAndOutcomeVariableProperties1738974972012 implements MigrationInterface {
  name = 'RewardMetricAndOutcomeVariableProperties1738974972012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" ADD "rewardMetricKey" character varying`);
    await queryRunner.query(
      `ALTER TABLE "mooclet_experiment_ref" ADD CONSTRAINT "UQ_66d62dfdea7d1d2c5eaa38fb220" UNIQUE ("rewardMetricKey")`
    );
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" ADD "outcomeVariableName" character varying`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'ts_configurable')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "mooclet_experiment_ref" ADD CONSTRAINT "FK_66d62dfdea7d1d2c5eaa38fb220" FOREIGN KEY ("rewardMetricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP CONSTRAINT "FK_66d62dfdea7d1d2c5eaa38fb220"`);
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum_old" AS ENUM('random', 'stratified random sampling', 'ts_configurable', 'uniform_random')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum_old" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum_old" RENAME TO "experiment_assignmentalgorithm_enum"`
    );
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP COLUMN "outcomeVariableName"`);
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP CONSTRAINT "UQ_66d62dfdea7d1d2c5eaa38fb220"`);
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP COLUMN "rewardMetricKey"`);
  }
}
