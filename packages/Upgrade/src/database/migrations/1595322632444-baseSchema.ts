import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line:class-name
export class baseSchema1595322632444 implements MigrationInterface {
  public name = 'baseSchema1595322632444';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "experiment_condition" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "twoCharacterId" character(2) NOT NULL, "name" character varying, "description" character varying, "conditionCode" character varying NOT NULL, "assignmentWeight" integer NOT NULL, "experimentId" uuid, CONSTRAINT "UQ_5b64b4936c5532dc91f224ecdcd" UNIQUE ("twoCharacterId"), CONSTRAINT "PK_5bdfd20bb9ace3415008c296fff" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_partition" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "twoCharacterId" character(2) NOT NULL, "expPoint" character varying NOT NULL, "expId" character varying, "description" character varying NOT NULL, "experimentId" uuid, CONSTRAINT "UQ_cb098e822278cbd63f7a0e90794" UNIQUE ("twoCharacterId"), CONSTRAINT "PK_8e0a8c9b0820a39beb2d6e6d8e4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "group" json, "workingGroup" json, "originalUserId" character varying, CONSTRAINT "PK_bb6db004eeb82db68de9225e877" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "uniquifier" character varying NOT NULL DEFAULT 1, "timeStamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "data" jsonb NOT NULL, "userId" character varying, CONSTRAINT "PK_350604cbdf991d5930d9e618fbd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TYPE "metric_type_enum" AS ENUM('continuous', 'categorical')`);
    await queryRunner.query(
      `CREATE TABLE "metric" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "key" character varying NOT NULL, "type" "metric_type_enum" NOT NULL DEFAULT 'continuous', "allowedData" text, CONSTRAINT "PK_612a9a5fc23f3e2a9473b21d23c" PRIMARY KEY ("key"))`
    );
    await queryRunner.query(`CREATE TYPE "query_repeatedmeasure_enum" AS ENUM('MEAN', 'EARLIEST', 'MOST_RECENT')`);
    await queryRunner.query(
      `CREATE TABLE "query" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" text NOT NULL, "query" jsonb NOT NULL, "repeatedMeasure" "query_repeatedmeasure_enum" NOT NULL DEFAULT 'MOST_RECENT', "metricKey" character varying, "experimentId" uuid, CONSTRAINT "PK_be23114e9d505264e2fdd227537" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_state_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled')`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_consistencyrule_enum" AS ENUM('individual', 'experiment', 'group')`
    );
    await queryRunner.query(`CREATE TYPE "experiment_assignmentunit_enum" AS ENUM('individual', 'group')`);
    await queryRunner.query(`CREATE TYPE "experiment_postexperimentrule_enum" AS ENUM('continue', 'revert')`);
    await queryRunner.query(
      `CREATE TABLE "experiment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "context" text array NOT NULL, "state" "experiment_state_enum" NOT NULL DEFAULT 'inactive', "startDate" TIMESTAMP, "startOn" TIMESTAMP, "endDate" TIMESTAMP, "consistencyRule" "experiment_consistencyrule_enum" NOT NULL, "assignmentUnit" "experiment_assignmentunit_enum" NOT NULL, "postExperimentRule" "experiment_postexperimentrule_enum" NOT NULL, "enrollmentCompleteCondition" json, "endOn" TIMESTAMP, "revertTo" uuid, "tags" text array, "group" text, CONSTRAINT "PK_4f6eec215c62eec1e0fde987caf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('admin', 'creator', 'user manager', 'reader')`);
    await queryRunner.query(
      `CREATE TABLE "user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "email" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "role" "user_role_enum" DEFAULT 'reader', "imageUrl" character varying, CONSTRAINT "PK_e12875dfb3b1d92d7d7c5377e22" PRIMARY KEY ("email"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_audit_log_type_enum" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted')`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_audit_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "experiment_audit_log_type_enum" NOT NULL, "data" json NOT NULL, "userEmail" character varying, CONSTRAINT "PK_6d096ff1d454e4d5718e7eceb8e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration')`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_error" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "endPoint" character varying, "errorCode" integer, "message" character varying, "name" character varying, "type" "experiment_error_type_enum" NOT NULL, CONSTRAINT "PK_92bb406901d75dd0de5cf119ed2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "explicit_group_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_a256b76485b96308e18f5cb7c51" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "preview_user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, CONSTRAINT "PK_30ce3f8f1211bc659b595edd175" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "explicit_individual_assignment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "previewUserId" character varying, "experimentId" uuid, "experimentConditionId" uuid, CONSTRAINT "PK_3d547feb84178609965e5f14ef0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "explicit_individual_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, CONSTRAINT "PK_b1b9d6ab6d5c789cd00c04efded" PRIMARY KEY ("userId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "flag_variation" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "value" character varying NOT NULL, "name" character varying, "description" character varying, "defaultVariation" boolean array, "featureFlagId" uuid, CONSTRAINT "PK_a298f24beb3eb5a0efdf344ff48" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "feature_flag" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "key" text NOT NULL, "description" character varying NOT NULL, "variationType" character varying NOT NULL, "status" boolean NOT NULL, CONSTRAINT "UQ_960310efa932f7a29eec57350b3" UNIQUE ("key"), CONSTRAINT "PK_f390205410d884907604a90c0f4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "group_assignment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "experimentId" uuid, "conditionId" uuid, CONSTRAINT "PK_87a3156de26cd619f0dab6d4411" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "group_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "experimentId" uuid, CONSTRAINT "PK_eab94b00f9762d7484c606840e0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TYPE "individual_assignment_assignmenttype_enum" AS ENUM('manual', 'algorithmic')`);
    await queryRunner.query(
      `CREATE TABLE "individual_assignment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "assignmentType" "individual_assignment_assignmenttype_enum" NOT NULL DEFAULT 'algorithmic', "experimentId" uuid, "userId" character varying, "conditionId" uuid, CONSTRAINT "PK_54c6be7e1a5389a6923cf48afc4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "individual_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "experimentId" uuid, "userId" character varying, CONSTRAINT "PK_2084e00363f40f96ce81ad788b6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "monitored_experiment_point_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "monitoredExperimentPointId" character varying, CONSTRAINT "PK_255b978cf73249198d7c133f8d3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "monitored_experiment_point_enrollmentcode_enum" AS ENUM('Student included in experiment', 'Student reached experiment point prior to experiment enrolling', 'Student was on exclusion list', 'GROUP was on exclusion list')`
    );
    await queryRunner.query(
      `CREATE TABLE "monitored_experiment_point" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "experimentId" character varying NOT NULL, "enrollmentCode" "monitored_experiment_point_enrollmentcode_enum", "userId" character varying, CONSTRAINT "PK_b30bbfe47f889bd9b1efb7ceefb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "scheduled_job" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "type" character varying NOT NULL, "timeStamp" TIMESTAMP NOT NULL, "executionArn" character varying NOT NULL, "experimentId" uuid, CONSTRAINT "PK_893185383f029ca8d57bb781fa8" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "setting" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "toCheckAuth" boolean NOT NULL, "toFilterMetric" boolean NOT NULL, CONSTRAINT "PK_fcb21187dc6094e24a48f677bed" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "metric_log" ("metricKey" character varying NOT NULL, "logId" integer NOT NULL, CONSTRAINT "PK_ebb632fa6382d423de632631326" PRIMARY KEY ("metricKey", "logId"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_81c6609c523e34b8f001cad717" ON "metric_log" ("metricKey") `);
    await queryRunner.query(`CREATE INDEX "IDX_c022cd84fd9fa789cbaee40b41" ON "metric_log" ("logId") `);
    await queryRunner.query(
      `ALTER TABLE "experiment_condition" ADD CONSTRAINT "FK_390a67a227a832e28d48d33607e" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_partition" ADD CONSTRAINT "FK_f8ce0c9eafea6bab79725373ab5" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_user" ADD CONSTRAINT "FK_f1d4193d241e06d2de07527c980" FOREIGN KEY ("originalUserId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "log" ADD CONSTRAINT "FK_cea2ed3a494729d4b21edbd2983" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "query" ADD CONSTRAINT "FK_16b236f2ca1472930abdbaf048a" FOREIGN KEY ("metricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "query" ADD CONSTRAINT "FK_80e30ce407c8e0555a6ad46d659" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_audit_log" ADD CONSTRAINT "FK_89d077ecfd3b7cc18fe6d6a89f8" FOREIGN KEY ("userEmail") REFERENCES "user"("email") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" ADD CONSTRAINT "FK_6763c88d585ff2ca4ef849491e0" FOREIGN KEY ("previewUserId") REFERENCES "preview_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" ADD CONSTRAINT "FK_502b25664bcdd4b6721122faf09" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" ADD CONSTRAINT "FK_69752e8939b65a718aa4b556e76" FOREIGN KEY ("experimentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "flag_variation" ADD CONSTRAINT "FK_b804d80b5aca0432175189d2d5b" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_assignment" ADD CONSTRAINT "FK_cc90d531cdcd7cc8c1a09732cf9" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_assignment" ADD CONSTRAINT "FK_f743f0cb2fa1582b94126508b60" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_exclusion" ADD CONSTRAINT "FK_15ae48e288f94c0aab841cd8073" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_assignment" ADD CONSTRAINT "FK_9cce80b86e5605438f52847b773" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_assignment" ADD CONSTRAINT "FK_77666162ac932bae16f6c3a876b" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_assignment" ADD CONSTRAINT "FK_9e4e1fa0317216c0a66cc9c4c71" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_exclusion" ADD CONSTRAINT "FK_43238be19de9500c290393b9078" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_exclusion" ADD CONSTRAINT "FK_de26ba8251f4ebf8b9c8ccf6236" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "monitored_experiment_point_log" ADD CONSTRAINT "FK_fb5b3afc5da75bf5377212770ef" FOREIGN KEY ("monitoredExperimentPointId") REFERENCES "monitored_experiment_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "monitored_experiment_point" ADD CONSTRAINT "FK_5b6866e6c1817823cb35c14736e" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_job" ADD CONSTRAINT "FK_8b449f6d80b8378f792c1a6bee2" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "metric_log" ADD CONSTRAINT "FK_81c6609c523e34b8f001cad7170" FOREIGN KEY ("metricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "metric_log" ADD CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c" FOREIGN KEY ("logId") REFERENCES "log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c"`);
    await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_81c6609c523e34b8f001cad7170"`);
    await queryRunner.query(`ALTER TABLE "scheduled_job" DROP CONSTRAINT "FK_8b449f6d80b8378f792c1a6bee2"`);
    await queryRunner.query(
      `ALTER TABLE "monitored_experiment_point" DROP CONSTRAINT "FK_5b6866e6c1817823cb35c14736e"`
    );
    await queryRunner.query(
      `ALTER TABLE "monitored_experiment_point_log" DROP CONSTRAINT "FK_fb5b3afc5da75bf5377212770ef"`
    );
    await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP CONSTRAINT "FK_de26ba8251f4ebf8b9c8ccf6236"`);
    await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP CONSTRAINT "FK_43238be19de9500c290393b9078"`);
    await queryRunner.query(`ALTER TABLE "individual_assignment" DROP CONSTRAINT "FK_9e4e1fa0317216c0a66cc9c4c71"`);
    await queryRunner.query(`ALTER TABLE "individual_assignment" DROP CONSTRAINT "FK_77666162ac932bae16f6c3a876b"`);
    await queryRunner.query(`ALTER TABLE "individual_assignment" DROP CONSTRAINT "FK_9cce80b86e5605438f52847b773"`);
    await queryRunner.query(`ALTER TABLE "group_exclusion" DROP CONSTRAINT "FK_15ae48e288f94c0aab841cd8073"`);
    await queryRunner.query(`ALTER TABLE "group_assignment" DROP CONSTRAINT "FK_f743f0cb2fa1582b94126508b60"`);
    await queryRunner.query(`ALTER TABLE "group_assignment" DROP CONSTRAINT "FK_cc90d531cdcd7cc8c1a09732cf9"`);
    await queryRunner.query(`ALTER TABLE "flag_variation" DROP CONSTRAINT "FK_b804d80b5aca0432175189d2d5b"`);
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" DROP CONSTRAINT "FK_69752e8939b65a718aa4b556e76"`
    );
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" DROP CONSTRAINT "FK_502b25664bcdd4b6721122faf09"`
    );
    await queryRunner.query(
      `ALTER TABLE "explicit_individual_assignment" DROP CONSTRAINT "FK_6763c88d585ff2ca4ef849491e0"`
    );
    await queryRunner.query(`ALTER TABLE "experiment_audit_log" DROP CONSTRAINT "FK_89d077ecfd3b7cc18fe6d6a89f8"`);
    await queryRunner.query(`ALTER TABLE "query" DROP CONSTRAINT "FK_80e30ce407c8e0555a6ad46d659"`);
    await queryRunner.query(`ALTER TABLE "query" DROP CONSTRAINT "FK_16b236f2ca1472930abdbaf048a"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_cea2ed3a494729d4b21edbd2983"`);
    await queryRunner.query(`ALTER TABLE "experiment_user" DROP CONSTRAINT "FK_f1d4193d241e06d2de07527c980"`);
    await queryRunner.query(`ALTER TABLE "experiment_partition" DROP CONSTRAINT "FK_f8ce0c9eafea6bab79725373ab5"`);
    await queryRunner.query(`ALTER TABLE "experiment_condition" DROP CONSTRAINT "FK_390a67a227a832e28d48d33607e"`);
    await queryRunner.query(`DROP INDEX "IDX_c022cd84fd9fa789cbaee40b41"`);
    await queryRunner.query(`DROP INDEX "IDX_81c6609c523e34b8f001cad717"`);
    await queryRunner.query(`DROP TABLE "metric_log"`);
    await queryRunner.query(`DROP TABLE "setting"`);
    await queryRunner.query(`DROP TABLE "scheduled_job"`);
    await queryRunner.query(`DROP TABLE "monitored_experiment_point"`);
    await queryRunner.query(`DROP TYPE "monitored_experiment_point_enrollmentcode_enum"`);
    await queryRunner.query(`DROP TABLE "monitored_experiment_point_log"`);
    await queryRunner.query(`DROP TABLE "individual_exclusion"`);
    await queryRunner.query(`DROP TABLE "individual_assignment"`);
    await queryRunner.query(`DROP TYPE "individual_assignment_assignmenttype_enum"`);
    await queryRunner.query(`DROP TABLE "group_exclusion"`);
    await queryRunner.query(`DROP TABLE "group_assignment"`);
    await queryRunner.query(`DROP TABLE "feature_flag"`);
    await queryRunner.query(`DROP TABLE "flag_variation"`);
    await queryRunner.query(`DROP TABLE "explicit_individual_exclusion"`);
    await queryRunner.query(`DROP TABLE "explicit_individual_assignment"`);
    await queryRunner.query(`DROP TABLE "preview_user"`);
    await queryRunner.query(`DROP TABLE "explicit_group_exclusion"`);
    await queryRunner.query(`DROP TABLE "experiment_error"`);
    await queryRunner.query(`DROP TYPE "experiment_error_type_enum"`);
    await queryRunner.query(`DROP TABLE "experiment_audit_log"`);
    await queryRunner.query(`DROP TYPE "experiment_audit_log_type_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "experiment"`);
    await queryRunner.query(`DROP TYPE "experiment_postexperimentrule_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_assignmentunit_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_consistencyrule_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_state_enum"`);
    await queryRunner.query(`DROP TABLE "query"`);
    await queryRunner.query(`DROP TYPE "query_repeatedmeasure_enum"`);
    await queryRunner.query(`DROP TABLE "metric"`);
    await queryRunner.query(`DROP TYPE "metric_type_enum"`);
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`DROP TABLE "experiment_user"`);
    await queryRunner.query(`DROP TABLE "experiment_partition"`);
    await queryRunner.query(`DROP TABLE "experiment_condition"`);
  }
}
