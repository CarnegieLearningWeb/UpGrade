import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagAuditLogs1725007254170 implements MigrationInterface {
  name = 'featureFlagAuditLogs1725007254170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "filterMode" SET DEFAULT 'excludeAll'`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_audit_log_type_enum" RENAME TO "experiment_audit_log_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_audit_log_type_enum" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted', 'experimentDataExported', 'experimentDataRequested', 'experimentDesignExported', 'featureFlagCreated', 'featureFlagUpdated', 'featureFlagStatusChanged', 'featureFlagDeleted', 'featureFlagDataExported', 'featureFlagDesignExported')`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_audit_log" ALTER COLUMN "type" TYPE "public"."experiment_audit_log_type_enum" USING "type"::"text"::"public"."experiment_audit_log_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_audit_log_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_audit_log_type_enum_old" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted', 'experimentDataExported', 'experimentDataRequested', 'experimentDesignExported')`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_audit_log" ALTER COLUMN "type" TYPE "public"."experiment_audit_log_type_enum_old" USING "type"::"text"::"public"."experiment_audit_log_type_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_audit_log_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_audit_log_type_enum_old" RENAME TO "experiment_audit_log_type_enum"`
    );
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "filterMode" SET DEFAULT 'includeAll'`);
  }
}
