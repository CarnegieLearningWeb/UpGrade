import { MigrationInterface, QueryRunner } from 'typeorm';

export class monitoredIndexesForExport1718377498760 implements MigrationInterface {
  name = 'monitoredIndexesForExport1718377498760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_4e9bf07b07327c60523614ceed" ON "monitored_decision_point_log" ("monitoredDecisionPointId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ac3dba0b5e060528dbdc34b51" ON "monitored_decision_point" ("experimentId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_7ac3dba0b5e060528dbdc34b51"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4e9bf07b07327c60523614ceed"`);
  }
}
