import { MigrationInterface, QueryRunner } from 'typeorm';

export class addExperimentType1665047953705 implements MigrationInterface {
  name = 'addExperimentType1665047953705';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."experiment_type_enum" AS ENUM('Simple', 'Factorial')`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD "type" "public"."experiment_type_enum" NOT NULL DEFAULT 'Simple'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."experiment_type_enum"`);
  }
}
