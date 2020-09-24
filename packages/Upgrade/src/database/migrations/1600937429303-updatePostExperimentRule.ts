import {MigrationInterface, QueryRunner} from 'typeorm';

// tslint:disable-next-line: class-name
export class updatePostExperimentRule1600937429303 implements MigrationInterface {
    public name = 'updatePostExperimentRule1600937429303';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."experiment_postexperimentrule_enum" RENAME TO "experiment_postexperimentrule_enum_old"`);
        await queryRunner.query(`CREATE TYPE "experiment_postexperimentrule_enum" AS ENUM('continue', 'revert', 'assign')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "postExperimentRule" TYPE "experiment_postexperimentrule_enum" USING "postExperimentRule"::"text"::"experiment_postexperimentrule_enum"`);
        await queryRunner.query(`DROP TYPE "experiment_postexperimentrule_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_audit_log_type_enum" RENAME TO "experiment_audit_log_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "experiment_audit_log_type_enum" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted', 'experimentDataExported')`);
        await queryRunner.query(`ALTER TABLE "experiment_audit_log" ALTER COLUMN "type" TYPE "experiment_audit_log_type_enum" USING "type"::"text"::"experiment_audit_log_type_enum"`);
        await queryRunner.query(`DROP TYPE "experiment_audit_log_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_error_type_enum" RENAME TO "experiment_error_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found')`);
        await queryRunner.query(`ALTER TABLE "experiment_error" ALTER COLUMN "type" TYPE "experiment_error_type_enum" USING "type"::"text"::"experiment_error_type_enum"`);
        await queryRunner.query(`DROP TYPE "experiment_error_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "experiment_error_type_enum_old" AS ENUM('Database auth fail', 'Database not reachable', 'Email send error', 'Error in migration', 'Error in the assignment algorithm', 'Error reported from client', 'Experiment user group not defined', 'Experiment user not defined', 'Invalid token', 'Parameter missing in the client request', 'Parameter not in the correct format', 'Query Failed', 'Token is not present in request', 'User ID not found', 'Working group is not a subset of user group')`);
        await queryRunner.query(`ALTER TABLE "experiment_error" ALTER COLUMN "type" TYPE "experiment_error_type_enum_old" USING "type"::"text"::"experiment_error_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "experiment_error_type_enum"`);
        await queryRunner.query(`ALTER TYPE "experiment_error_type_enum_old" RENAME TO  "experiment_error_type_enum"`);
        await queryRunner.query(`CREATE TYPE "experiment_audit_log_type_enum_old" AS ENUM('experimentCreated', 'experimentDeleted', 'experimentStateChanged', 'experimentUpdated')`);
        await queryRunner.query(`ALTER TABLE "experiment_audit_log" ALTER COLUMN "type" TYPE "experiment_audit_log_type_enum_old" USING "type"::"text"::"experiment_audit_log_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "experiment_audit_log_type_enum"`);
        await queryRunner.query(`ALTER TYPE "experiment_audit_log_type_enum_old" RENAME TO  "experiment_audit_log_type_enum"`);
        await queryRunner.query(`CREATE TYPE "experiment_postexperimentrule_enum_old" AS ENUM('continue', 'revert')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "postExperimentRule" TYPE "experiment_postexperimentrule_enum_old" USING "postExperimentRule"::"text"::"experiment_postexperimentrule_enum_old"`);
        await queryRunner.query(`DROP TYPE "experiment_postexperimentrule_enum"`);
        await queryRunner.query(`ALTER TYPE "experiment_postexperimentrule_enum_old" RENAME TO  "experiment_postexperimentrule_enum"`);
    }

}
