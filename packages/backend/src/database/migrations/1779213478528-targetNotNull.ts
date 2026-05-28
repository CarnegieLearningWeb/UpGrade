import { MigrationInterface, QueryRunner } from 'typeorm';

export class TargetNotNull1779213478528 implements MigrationInterface {
  name = 'TargetNotNull1779213478528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decision_point" ALTER COLUMN "target" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decision_point" ALTER COLUMN "target" DROP NOT NULL`);
  }
}
