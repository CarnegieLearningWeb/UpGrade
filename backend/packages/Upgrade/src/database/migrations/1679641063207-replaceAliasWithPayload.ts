import { MigrationInterface, QueryRunner } from 'typeorm';

export class replaceAliasWithPayload1679641063207 implements MigrationInterface {
  name = 'replaceAliasWithPayload1679641063207';

  // public async up(queryRunner: QueryRunner): Promise<void> {
  //     await queryRunner.query(`CREATE TYPE "condition_payload_payloadtype_enum" AS ENUM('string', 'json', 'csv')`);
  //     await queryRunner.query(`CREATE TABLE "condition_payload" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "payloadValue" character varying NOT NULL, "payloadType" "condition_payload_payloadtype_enum" NOT NULL DEFAULT 'string', "parentConditionId" uuid, "decisionPointId" uuid, CONSTRAINT "PK_64bdd8ec11321806973e7d627ae" PRIMARY KEY ("id"))`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" DROP COLUMN "alias"`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" ADD "payloadValue" character varying`);
  //     await queryRunner.query(`CREATE TYPE "public"."level_payloadtype_enum" AS ENUM('string', 'json', 'csv')`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" ADD "payloadType" "public"."level_payloadtype_enum" NOT NULL DEFAULT 'string'`);
  //     await queryRunner.query(`ALTER TYPE "public"."experiment_error_type_enum" RENAME TO "experiment_error_type_enum_old"`);
  //     await queryRunner.query(`CREATE TYPE "public"."experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point', 'Experiment ID provided is invalid for shared Decision Point')`);
  //     await queryRunner.query(`ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum" USING "type"::"text"::"public"."experiment_error_type_enum"`);
  //     await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum_old"`);
  //     await queryRunner.query(`ALTER TABLE "condition_payload" ADD CONSTRAINT "FK_1b19d3c212f0314144de579a120" FOREIGN KEY ("parentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  //     await queryRunner.query(`ALTER TABLE "condition_payload" ADD CONSTRAINT "FK_017f4e5a324cb198939fff2af8c" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  // }

  // public async down(queryRunner: QueryRunner): Promise<void> {
  //     await queryRunner.query(`ALTER TABLE "condition_payload" DROP CONSTRAINT "FK_017f4e5a324cb198939fff2af8c"`);
  //     await queryRunner.query(`ALTER TABLE "condition_payload" DROP CONSTRAINT "FK_1b19d3c212f0314144de579a120"`);
  //     await queryRunner.query(`CREATE TYPE "public"."experiment_error_type_enum_old" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point')`);
  //     await queryRunner.query(`ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum_old" USING "type"::"text"::"public"."experiment_error_type_enum_old"`);
  //     await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum"`);
  //     await queryRunner.query(`ALTER TYPE "public"."experiment_error_type_enum_old" RENAME TO "experiment_error_type_enum"`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" DROP COLUMN "payloadType"`);
  //     await queryRunner.query(`DROP TYPE "public"."level_payloadtype_enum"`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" DROP COLUMN "payloadValue"`);
  //     await queryRunner.query(`ALTER TABLE "public"."level" ADD "alias" character varying`);
  //     await queryRunner.query(`DROP TABLE "condition_payload"`);
  //     await queryRunner.query(`DROP TYPE "condition_payload_payloadtype_enum"`);
  // }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."level" RENAME COLUMN "alias" TO "payloadValue"`);
    await queryRunner.query(`CREATE TYPE "public"."level_payload_type_enum" AS ENUM('string', 'json', 'csv')`);
    await queryRunner.query(
      `ALTER TABLE "public"."level" ADD "payloadType" "public"."level_payload_type_enum" NOT NULL DEFAULT 'string'`
    );

    await queryRunner.query(`ALTER TABLE "condition_alias" RENAME TO "condition_payload"`);
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" RENAME COLUMN "aliasName" TO "payloadValue"`);
    await queryRunner.query(`CREATE TYPE "public"."condition_payload_type_enum" AS ENUM('string', 'json', 'csv')`);
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ADD "payloadType" "public"."condition_payload_type_enum" NOT NULL DEFAULT 'string'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" DROP COLUMN "payloadType"`);
    await queryRunner.query(`DROP TYPE "public"."condition_payload_type_enum"`);
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" RENAME COLUMN "payloadValue" TO "aliasName"`);
    await queryRunner.query(`ALTER TABLE "condition_payload" RENAME TO "condition_alias"`);

    await queryRunner.query(`ALTER TABLE "public"."level" DROP COLUMN "payloadType"`);
    await queryRunner.query(`DROP TYPE "public"."level_payload_type_enum"`);
    await queryRunner.query(`ALTER TABLE "public"."level" RENAME COLUMN "payloadValue" TO "alias"`);
  }
}
