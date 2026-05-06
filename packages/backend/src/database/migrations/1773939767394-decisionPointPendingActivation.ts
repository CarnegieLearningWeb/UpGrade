import { MigrationInterface, QueryRunner } from 'typeorm';

export class DecisionPointPendingActivation1773939767394 implements MigrationInterface {
  name = 'DecisionPointPendingActivation1773939767394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing DPs were created before this feature; they are already active.
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD COLUMN "pendingActivation" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP COLUMN "pendingActivation"`);
  }
}
