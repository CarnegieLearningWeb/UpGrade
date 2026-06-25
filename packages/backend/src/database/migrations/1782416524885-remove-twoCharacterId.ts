import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTwoCharacterId1782416524885 implements MigrationInterface {
  name = 'RemoveTwoCharacterId1782416524885';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decision_point" DROP COLUMN "twoCharacterId"`);
    await queryRunner.query(`ALTER TABLE "experiment_condition" DROP COLUMN "twoCharacterId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add as nullable to keep rollback runnable on non-empty tables.
    // If NOT NULL is required, add a backfill step before enforcing it.
    await queryRunner.query(`ALTER TABLE "experiment_condition" ADD COLUMN "twoCharacterId" character(2)`);
    await queryRunner.query(`ALTER TABLE "decision_point" ADD COLUMN "twoCharacterId" character(2)`);

    await queryRunner.query(
      `ALTER TABLE "experiment_condition" ADD CONSTRAINT "UQ_5b64b4936c5532dc91f224ecdcd" UNIQUE ("twoCharacterId")`
    );
    await queryRunner.query(
      `ALTER TABLE "decision_point" ADD CONSTRAINT "UQ_99875dcd62e9df24745809953f2" UNIQUE ("twoCharacterId")`
    );
  }
}
