import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagFilterModeChangeDefault1722540825048 implements MigrationInterface {
  name = 'featureFlagFilterModeChangeDefault1722540825048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" ALTER COLUMN "enabled" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "feature_flag" ALTER COLUMN "filterMode" SET DEFAULT 'excludeAll'`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" ALTER COLUMN "enabled" SET DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" ALTER COLUMN "enabled" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "feature_flag" ALTER COLUMN "filterMode" SET DEFAULT 'includeAll'`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" ALTER COLUMN "enabled" DROP DEFAULT`);
  }
}
