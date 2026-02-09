import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagFilterMode1714680515570 implements MigrationInterface {
  name = 'featureFlagFilterMode1714680515570';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."feature_flag_filtermode_enum" AS ENUM('includeAll', 'excludeAll')`);
    await queryRunner.query(
      `ALTER TABLE "feature_flag" ADD "filterMode" "public"."feature_flag_filtermode_enum" NOT NULL DEFAULT 'includeAll'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "filterMode"`);
    await queryRunner.query(`DROP TYPE "public"."feature_flag_filtermode_enum"`);
  }
}
