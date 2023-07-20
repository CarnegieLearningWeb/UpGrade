import { MigrationInterface, QueryRunner } from 'typeorm';

export class uniquifier1686575888877 implements MigrationInterface {
  name = 'uniquifier1686575888877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point_log" ADD "condition" character varying`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point_log" ADD "uniquifier" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point_log" DROP COLUMN "uniquifier"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point_log" DROP COLUMN "condition"`);
  }
}
