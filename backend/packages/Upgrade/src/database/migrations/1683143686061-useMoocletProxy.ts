import { MigrationInterface, QueryRunner } from 'typeorm';

export class useMoocletProxy1683143686061 implements MigrationInterface {
  name = 'useMoocletProxy1683143686061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" DROP CONSTRAINT "FK_6620368844e3608be5ef131baf3"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" DROP CONSTRAINT "FK_c95e8b36cee12dbdaa643de2385"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ADD "useMoocletsProxy" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TYPE "public"."level_payload_type_enum" RENAME TO "level_payload_type_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."level_payloadtype_enum" AS ENUM('string', 'json', 'csv')`);
    await queryRunner.query(`ALTER TABLE "public"."level" ALTER COLUMN "payloadType" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."level" ALTER COLUMN "payloadType" TYPE "public"."level_payloadtype_enum" USING "payloadType"::"text"::"public"."level_payloadtype_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."level" ALTER COLUMN "payloadType" SET DEFAULT 'string'`);
    await queryRunner.query(`DROP TYPE "public"."level_payload_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."condition_payload_type_enum" RENAME TO "condition_payload_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."condition_payload_payloadtype_enum" AS ENUM('string', 'json', 'csv')`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" TYPE "public"."condition_payload_payloadtype_enum" USING "payloadType"::"text"::"public"."condition_payload_payloadtype_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" SET DEFAULT 'string'`);
    await queryRunner.query(`DROP TYPE "public"."condition_payload_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum" RENAME TO "experiment_error_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point', 'Experiment ID provided is invalid for shared Decision Point', 'Caliper profile or event not supported')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum" USING "type"::"text"::"public"."experiment_error_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ADD CONSTRAINT "FK_1b19d3c212f0314144de579a120" FOREIGN KEY ("parentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ADD CONSTRAINT "FK_017f4e5a324cb198939fff2af8c" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" DROP CONSTRAINT "FK_017f4e5a324cb198939fff2af8c"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" DROP CONSTRAINT "FK_1b19d3c212f0314144de579a120"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum_old" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum_old" USING "type"::"text"::"public"."experiment_error_type_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum_old" RENAME TO "experiment_error_type_enum"`
    );
    await queryRunner.query(`CREATE TYPE "public"."condition_payload_type_enum_old" AS ENUM('string', 'json', 'csv')`);
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" TYPE "public"."condition_payload_type_enum_old" USING "payloadType"::"text"::"public"."condition_payload_type_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_payload" ALTER COLUMN "payloadType" SET DEFAULT 'string'`);
    await queryRunner.query(`DROP TYPE "public"."condition_payload_payloadtype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."condition_payload_type_enum_old" RENAME TO "condition_payload_type_enum"`
    );
    await queryRunner.query(`CREATE TYPE "public"."level_payload_type_enum_old" AS ENUM('string', 'json', 'csv')`);
    await queryRunner.query(`ALTER TABLE "public"."level" ALTER COLUMN "payloadType" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."level" ALTER COLUMN "payloadType" TYPE "public"."level_payload_type_enum_old" USING "payloadType"::"text"::"public"."level_payload_type_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "public"."level" ALTER COLUMN "payloadType" SET DEFAULT 'string'`);
    await queryRunner.query(`DROP TYPE "public"."level_payloadtype_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."level_payload_type_enum_old" RENAME TO "level_payload_type_enum"`);
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "useMoocletsProxy"`);
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ADD CONSTRAINT "FK_c95e8b36cee12dbdaa643de2385" FOREIGN KEY ("parentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_payload" ADD CONSTRAINT "FK_6620368844e3608be5ef131baf3" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
