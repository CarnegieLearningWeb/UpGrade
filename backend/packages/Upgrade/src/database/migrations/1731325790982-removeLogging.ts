import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLogging1731325790982 implements MigrationInterface {
  name = 'RemoveLogging1731325790982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "logging"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" ADD "logging" boolean NOT NULL DEFAULT false`);
  }
}
