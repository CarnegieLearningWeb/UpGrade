import { MigrationInterface, QueryRunner } from 'typeorm';

export class metricContextNullable1717515138666 implements MigrationInterface {
  name = 'metricContextNullable1717515138666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metric" ALTER COLUMN "context" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metric" ALTER COLUMN "context" SET NOT NULL`);
  }
}
