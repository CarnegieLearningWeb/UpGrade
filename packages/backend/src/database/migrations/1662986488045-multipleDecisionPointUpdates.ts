import { MigrationInterface, QueryRunner } from 'typeorm';

export class multipleDecisionPointUpdates1662986488045 implements MigrationInterface {
  name = 'multipleDecisionPointUpdates1662986488045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c2bb5acceb92a29fd022c5ff30"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "decisionPoint"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "site" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "target" character varying`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "experimentId" character varying`);
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" DROP CONSTRAINT "FK_151c40ca733232929477532903a"`);
    await queryRunner.query(
      `ALTER TABLE "public"."individual_enrollment" DROP CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73"`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" DROP CONSTRAINT "FK_6620368844e3608be5ef131baf3"`);
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP CONSTRAINT "PK_e55e73f039848e3a1cac0e491bb"`);
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "public"."decision_point" ADD "id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD CONSTRAINT "PK_e55e73f039848e3a1cac0e491bb" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP CONSTRAINT "UQ_99875dcd62e9df24745809953f2"`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_condition" DROP CONSTRAINT "UQ_5b64b4936c5532dc91f224ecdcd"`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" DROP COLUMN "decisionPointId"`);
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" ADD "decisionPointId" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum" RENAME TO "experiment_error_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found', 'Experiment ID not provided for shared Decision Point')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum" USING "type"::"text"::"public"."experiment_error_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum_old"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_151c40ca733232929477532903"`);
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" DROP COLUMN "partitionId"`);
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" ADD "partitionId" uuid`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c6b061b4c2e9cf33b19aea73e7"`);
    await queryRunner.query(`ALTER TABLE "public"."individual_enrollment" DROP COLUMN "partitionId"`);
    await queryRunner.query(`ALTER TABLE "public"."individual_enrollment" ADD "partitionId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" DROP CONSTRAINT "FK_4e9bf07b07327c60523614ceed0"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" DROP COLUMN "monitoredDecisionPointId"`
    );
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point_log" ADD "monitoredDecisionPointId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point" DROP CONSTRAINT "PK_7fd52382a1b12f6d55ec2cc674d"`
    );
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point" ADD CONSTRAINT "PK_7fd52382a1b12f6d55ec2cc674d" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_151c40ca733232929477532903" ON "public"."group_enrollment" ("partitionId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6b061b4c2e9cf33b19aea73e7" ON "public"."individual_enrollment" ("partitionId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8f3c5d7e18ba5b504b91d96c2" ON "public"."monitored_decision_point" ("site") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_400734a43360ef813c6080ddbb" ON "public"."monitored_decision_point" ("target") `
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_alias" ADD CONSTRAINT "FK_6620368844e3608be5ef131baf3" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."group_enrollment" ADD CONSTRAINT "FK_151c40ca733232929477532903a" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."individual_enrollment" ADD CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" ADD CONSTRAINT "FK_4e9bf07b07327c60523614ceed0" FOREIGN KEY ("monitoredDecisionPointId") REFERENCES "monitored_decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" DROP CONSTRAINT "FK_4e9bf07b07327c60523614ceed0"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."individual_enrollment" DROP CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73"`
    );
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" DROP CONSTRAINT "FK_151c40ca733232929477532903a"`);
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" DROP CONSTRAINT "FK_6620368844e3608be5ef131baf3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_400734a43360ef813c6080ddbb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c8f3c5d7e18ba5b504b91d96c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c6b061b4c2e9cf33b19aea73e7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_151c40ca733232929477532903"`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point" DROP CONSTRAINT "PK_7fd52382a1b12f6d55ec2cc674d"`
    );
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" ADD "id" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point" ADD CONSTRAINT "PK_7fd52382a1b12f6d55ec2cc674d" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" DROP COLUMN "monitoredDecisionPointId"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" ADD "monitoredDecisionPointId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point_log" ADD CONSTRAINT "FK_4e9bf07b07327c60523614ceed0" FOREIGN KEY ("monitoredDecisionPointId") REFERENCES "monitored_decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "public"."individual_enrollment" DROP COLUMN "partitionId"`);
    await queryRunner.query(`ALTER TABLE "public"."individual_enrollment" ADD "partitionId" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c6b061b4c2e9cf33b19aea73e7" ON "public"."individual_enrollment" ("partitionId") `
    );
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" DROP COLUMN "partitionId"`);
    await queryRunner.query(`ALTER TABLE "public"."group_enrollment" ADD "partitionId" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_151c40ca733232929477532903" ON "public"."group_enrollment" ("partitionId") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_error_type_enum_old" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_error" ALTER COLUMN "type" TYPE "public"."experiment_error_type_enum_old" USING "type"::"text"::"public"."experiment_error_type_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_error_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_error_type_enum_old" RENAME TO "experiment_error_type_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" DROP COLUMN "decisionPointId"`);
    await queryRunner.query(`ALTER TABLE "public"."condition_alias" ADD "decisionPointId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment_condition" ADD CONSTRAINT "UQ_5b64b4936c5532dc91f224ecdcd" UNIQUE ("twoCharacterId")`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD CONSTRAINT "UQ_99875dcd62e9df24745809953f2" UNIQUE ("twoCharacterId")`
    );
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP CONSTRAINT "PK_e55e73f039848e3a1cac0e491bb"`);
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "public"."decision_point" ADD "id" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD CONSTRAINT "PK_e55e73f039848e3a1cac0e491bb" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."condition_alias" ADD CONSTRAINT "FK_6620368844e3608be5ef131baf3" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."individual_enrollment" ADD CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."group_enrollment" ADD CONSTRAINT "FK_151c40ca733232929477532903a" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "experimentId"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "target"`);
    await queryRunner.query(`ALTER TABLE "public"."monitored_decision_point" DROP COLUMN "site"`);
    await queryRunner.query(
      `ALTER TABLE "public"."monitored_decision_point" ADD "decisionPoint" character varying NOT NULL`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2bb5acceb92a29fd022c5ff30" ON "public"."monitored_decision_point" ("decisionPoint") `
    );
  }
}
