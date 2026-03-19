import { MigrationInterface, QueryRunner } from 'typeorm';

export class QueryOrder1773939767393 implements MigrationInterface {
  name = 'QueryOrder1773939767393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."query" ADD "order" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."query" DROP COLUMN "order"`);
  }
}
