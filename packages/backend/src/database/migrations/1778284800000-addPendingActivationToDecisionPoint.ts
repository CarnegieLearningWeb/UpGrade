import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingActivationToDecisionPoint1778284800000 implements MigrationInterface {
  name = 'AddPendingActivationToDecisionPoint1778284800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD COLUMN IF NOT EXISTS "pendingActivation" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `UPDATE "public"."decision_point" dp
       SET "pendingActivation" = true
       FROM "public"."experiment" e
       WHERE dp."experimentId" = e.id
       AND e.state = 'inactive'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP COLUMN "pendingActivation"`);
  }
}
