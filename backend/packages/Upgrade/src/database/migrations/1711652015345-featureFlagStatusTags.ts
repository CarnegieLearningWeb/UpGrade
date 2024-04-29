import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagStatusTags1711652015345 implements MigrationInterface {
  name = 'featureFlagStatusTags1711652015345';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "variationType"`);
    await queryRunner.query(`ALTER TABLE "feature_flag" ADD "tags" text array`);
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."feature_flag_status_enum" AS ENUM('enabled', 'disabled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag" ADD "status" "public"."feature_flag_status_enum" NOT NULL DEFAULT 'disabled'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."feature_flag_status_enum"`);
    await queryRunner.query(`ALTER TABLE "feature_flag" ADD "status" boolean NOT NULL`);
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "feature_flag" ADD "variationType" character varying NOT NULL`);
  }
}
