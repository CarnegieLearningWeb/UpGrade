import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupMoocletEntities1781308800000 implements MigrationInterface {
  name = 'CleanupMoocletEntities1781308800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate any existing ts_configurable experiments to thompson_sampling
    await queryRunner.query(
      `UPDATE "experiment" SET "assignmentAlgorithm" = 'thompson_sampling' WHERE "assignmentAlgorithm" = 'ts_configurable'`
    );

    // Drop mooclet tables (cascade handles FK references)
    await queryRunner.query(`DROP TABLE IF EXISTS "mooclet_version_condition_map"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mooclet_experiment_ref"`);

    // Remove ts_configurable from the assignment algorithm enum
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'thompson_sampling')`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore ts_configurable enum value
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
  }
}
