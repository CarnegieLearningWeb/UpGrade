import { MigrationInterface, QueryRunner } from 'typeorm';

export class addTokenValidationFailedEnum1720515933833 implements MigrationInterface {
  name = 'addTokenValidationFailedEnum1720515933833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum" RENAME TO "experiment_error_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'JWT Token validation failed', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point', 'Experiment ID provided is invalid for shared Decision Point', 'Caliper profile or event not supported')`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum" USING "type"::"text"::"public"."experiment_error_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum_old" AS ENUM('Caliper profile or event not supported', 'Condition not found', 'Database auth fail', 'Database not reachable', 'Email send error', 'Error in migration', 'Error in the assignment algorithm', 'Error reported from client', 'Experiment ID not provided for shared Decision Point', 'Experiment ID provided is invalid for shared Decision Point', 'Experiment user group not defined', 'Experiment user not defined', 'Invalid token', 'Parameter missing in the client request', 'Parameter not in the correct format', 'Query Failed', 'Token is not present in request', 'User ID not found', 'Working group is not a subset of user group')`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum_old" USING "type"::"text"::"public"."experiment_error_type_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum_old" RENAME TO "experiment_error_type_enum"`
    );
  }
}
