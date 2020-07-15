import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line:class-name
export class experimentEndDate1594808911584 implements MigrationInterface {
  public name = 'experimentEndDate1594808911584';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" ADD "endDate" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "endDate"`);
  }
}
