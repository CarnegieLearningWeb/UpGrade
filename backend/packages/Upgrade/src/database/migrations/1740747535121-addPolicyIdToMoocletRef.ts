import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolicyIdToMoocletRef1740747535121 implements MigrationInterface {
  name = 'AddPolicyIdToMoocletRef1740747535121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP CONSTRAINT "FK_66d62dfdea7d1d2c5eaa38fb220"`);
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" ADD "policyId" integer`);
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP CONSTRAINT "UQ_66d62dfdea7d1d2c5eaa38fb220"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mooclet_experiment_ref" ADD CONSTRAINT "UQ_66d62dfdea7d1d2c5eaa38fb220" UNIQUE ("rewardMetricKey")`
    );
    await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP COLUMN "policyId"`);
    await queryRunner.query(
      `ALTER TABLE "mooclet_experiment_ref" ADD CONSTRAINT "FK_66d62dfdea7d1d2c5eaa38fb220" FOREIGN KEY ("rewardMetricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
