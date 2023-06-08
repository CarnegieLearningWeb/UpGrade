import { MigrationInterface, QueryRunner } from 'typeorm';

export class uniquifier1686205268484 implements MigrationInterface {
  name = 'uniquifier1686205268484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "uniquifier" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "uniquifier"`);
  }
}
