import { MigrationInterface, QueryRunner } from 'typeorm';

export class queryOrder1752000000000 implements MigrationInterface {
  name = 'queryOrder1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."query" ADD "order" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."query" DROP COLUMN "order"`);
  }
}
