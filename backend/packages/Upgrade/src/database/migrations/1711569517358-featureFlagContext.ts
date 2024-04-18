import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagContext1711569517358 implements MigrationInterface {
  name = 'featureFlagContext1711569517358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag" ADD "context" text array NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP COLUMN "context"`);
  }
}
