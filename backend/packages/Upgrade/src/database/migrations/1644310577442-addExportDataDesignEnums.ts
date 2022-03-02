import {MigrationInterface, QueryRunner} from "typeorm";

export class addExportDataDesignEnums1644310577442 implements MigrationInterface {
    name = 'addExportDataDesignEnums1644310577442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."experiment_audit_log_type_enum" RENAME TO "experiment_audit_log_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."experiment_audit_log_type_enum" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted', 'experimentDataExported', 'experimentDataRequested', 'experimentDesignExported')`);
        await queryRunner.query(`ALTER TABLE "public"."experiment_audit_log" ALTER COLUMN "type" TYPE "public"."experiment_audit_log_type_enum" USING "type"::"text"::"public"."experiment_audit_log_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."experiment_audit_log_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."experiment_audit_log_type_enum_old" AS ENUM('experimentCreated', 'experimentDataExported', 'experimentDeleted', 'experimentStateChanged', 'experimentUpdated')`);
        await queryRunner.query(`ALTER TABLE "public"."experiment_audit_log" ALTER COLUMN "type" TYPE "public"."experiment_audit_log_type_enum_old" USING "type"::"text"::"public"."experiment_audit_log_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."experiment_audit_log_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_audit_log_type_enum_old" RENAME TO "experiment_audit_log_type_enum"`);
    }

}
