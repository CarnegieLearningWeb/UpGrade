import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line: class-name
export class addLoggingToExperiment1619951259304 implements MigrationInterface {
  public name = 'addLoggingToExperiment1619951259304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" ADD "logging" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "logging"`);
  }
}
