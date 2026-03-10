import { MigrationInterface, QueryRunner } from 'typeorm';

export class userTimeZone1660214866240 implements MigrationInterface {
  name = 'userTimeZone1660214866240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."user" ADD "localTimeZone" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."user" DROP COLUMN "localTimeZone"`);
  }
}
