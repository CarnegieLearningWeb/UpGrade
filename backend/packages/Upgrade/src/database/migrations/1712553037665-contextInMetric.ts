import { MigrationInterface, QueryRunner } from 'typeorm';

export class contextInMetric1712553037665 implements MigrationInterface {
  name = 'contextInMetric1712553037665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metric" ADD "context" text array NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metric" DROP COLUMN "context"`);
  }
}
