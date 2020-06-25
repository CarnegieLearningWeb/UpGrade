import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line:class-name
export class dataLogUpdate1593079413681 implements MigrationInterface {
  public name = 'dataLogUpdate1593079413681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "log" ADD "uniquifier" character varying NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "log" ADD "timeStamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "log" DROP COLUMN "timeStamp"`);
    await queryRunner.query(`ALTER TABLE "log" DROP COLUMN "uniquifier"`);
  }
}
