import { MigrationInterface, QueryRunner } from 'typeorm';

export class moocletDetails1683237858516 implements MigrationInterface {
  name = 'moocletDetails1683237858516';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."experiment" ADD "moocletDetails" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "moocletDetails"`);
  }
}
