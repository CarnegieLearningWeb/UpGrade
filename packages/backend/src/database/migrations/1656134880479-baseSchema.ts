import { MigrationInterface, QueryRunner } from 'typeorm';

export class baseSchema1656134880479 implements MigrationInterface {
  name = 'baseSchema1656134880479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "experiment_condition" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "twoCharacterId" character(2) NOT NULL, "name" character varying, "description" character varying, "conditionCode" character varying NOT NULL, "assignmentWeight" real NOT NULL, "order" integer, "experimentId" uuid, CONSTRAINT "UQ_5b64b4936c5532dc91f224ecdcd" UNIQUE ("twoCharacterId"), CONSTRAINT "PK_5bdfd20bb9ace3415008c296fff" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "group" json, "workingGroup" json, "originalUserId" character varying, CONSTRAINT "PK_bb6db004eeb82db68de9225e877" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "uniquifier" character varying NOT NULL DEFAULT '1', "timeStamp" TIMESTAMP NOT NULL DEFAULT now(), "data" jsonb NOT NULL, "userId" character varying, CONSTRAINT "PK_350604cbdf991d5930d9e618fbd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_cea2ed3a494729d4b21edbd298" ON "log" ("userId") `);
    await queryRunner.query(`CREATE TYPE "metric_type_enum" AS ENUM('continuous', 'categorical')`);
    await queryRunner.query(
      `CREATE TABLE "metric" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "key" character varying NOT NULL, "type" "metric_type_enum" NOT NULL DEFAULT 'continuous', "allowedData" text, CONSTRAINT "PK_612a9a5fc23f3e2a9473b21d23c" PRIMARY KEY ("key"))`
    );
    await queryRunner.query(`CREATE TYPE "query_repeatedmeasure_enum" AS ENUM('MEAN', 'EARLIEST', 'MOST RECENT')`);
    await queryRunner.query(
      `CREATE TABLE "query" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" text NOT NULL, "query" jsonb NOT NULL, "repeatedMeasure" "query_repeatedmeasure_enum" NOT NULL DEFAULT 'MOST RECENT', "metricKey" character varying, "experimentId" uuid, CONSTRAINT "PK_be23114e9d505264e2fdd227537" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "state_time_log_fromstate_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled')`
    );
    await queryRunner.query(
      `CREATE TYPE "state_time_log_tostate_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled')`
    );
    await queryRunner.query(
      `CREATE TABLE "state_time_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "fromState" "state_time_log_fromstate_enum" NOT NULL, "toState" "state_time_log_tostate_enum" NOT NULL, "timeLog" TIMESTAMP NOT NULL, "experimentId" uuid, CONSTRAINT "PK_760d29f7bfded82e5b51cfabb26" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_segment_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_915022e01487b0245a16cbc55f" UNIQUE ("segmentId"), CONSTRAINT "REL_7d22a811ae04d2ed1b8af0e9c0" UNIQUE ("experimentId"), CONSTRAINT "PK_54747bc2fc0d9a509f551371b60" PRIMARY KEY ("segmentId", "experimentId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "group_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_831eaa3563190f840db9ebe4f95" PRIMARY KEY ("groupId", "type", "segmentId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "individual_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_0a965e751d45b5921549274a65c" PRIMARY KEY ("userId", "segmentId"))`
    );
    await queryRunner.query(`CREATE TYPE "segment_type_enum" AS ENUM('public', 'private', 'global_exclude')`);
    await queryRunner.query(
      `CREATE TABLE "segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "context" character varying NOT NULL, "type" "segment_type_enum" NOT NULL DEFAULT 'public', CONSTRAINT "PK_d648ac58d8e0532689dfb8ad7ef" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_segment_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_95161b8f3f8284268fd3af07f1" UNIQUE ("segmentId"), CONSTRAINT "REL_f9e3c925808cc88fe34cafa0ec" UNIQUE ("experimentId"), CONSTRAINT "PK_b3f79c9b9aae99668e0c9860b97" PRIMARY KEY ("segmentId", "experimentId"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_state_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled')`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_consistencyrule_enum" AS ENUM('individual', 'experiment', 'group')`
    );
    await queryRunner.query(`CREATE TYPE "experiment_assignmentunit_enum" AS ENUM('individual', 'group')`);
    await queryRunner.query(`CREATE TYPE "experiment_postexperimentrule_enum" AS ENUM('continue', 'revert', 'assign')`);
    await queryRunner.query(`CREATE TYPE "experiment_filtermode_enum" AS ENUM('includeAll', 'excludeAll')`);
    await queryRunner.query(
      `CREATE TABLE "experiment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "context" text array NOT NULL, "state" "experiment_state_enum" NOT NULL DEFAULT 'inactive', "startOn" TIMESTAMP, "consistencyRule" "experiment_consistencyrule_enum" NOT NULL, "assignmentUnit" "experiment_assignmentunit_enum" NOT NULL, "postExperimentRule" "experiment_postexperimentrule_enum" NOT NULL, "enrollmentCompleteCondition" json, "endOn" TIMESTAMP, "revertTo" uuid, "tags" text array, "group" text, "logging" boolean NOT NULL DEFAULT false, "filterMode" "experiment_filtermode_enum" NOT NULL DEFAULT 'includeAll', "backendVersion" character varying NOT NULL DEFAULT '1.0.0', CONSTRAINT "PK_4f6eec215c62eec1e0fde987caf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "decision_point" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "twoCharacterId" character(2) NOT NULL, "site" character varying NOT NULL, "target" character varying, "description" character varying NOT NULL, "order" integer, "experimentId" uuid, CONSTRAINT "UQ_99875dcd62e9df24745809953f2" UNIQUE ("twoCharacterId"), CONSTRAINT "PK_e55e73f039848e3a1cac0e491bb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('admin', 'creator', 'user manager', 'reader')`);
    await queryRunner.query(
      `CREATE TABLE "user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "email" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "role" "user_role_enum" DEFAULT 'creator', "imageUrl" character varying, CONSTRAINT "PK_e12875dfb3b1d92d7d7c5377e22" PRIMARY KEY ("email"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_audit_log_type_enum" AS ENUM('experimentCreated', 'experimentUpdated', 'experimentStateChanged', 'experimentDeleted', 'experimentDataExported', 'experimentDataRequested', 'experimentDesignExported')`
    );
    await queryRunner.query(
      `CREATE TABLE "experiment_audit_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "experiment_audit_log_type_enum" NOT NULL, "data" json NOT NULL, "userEmail" character varying, CONSTRAINT "PK_6d096ff1d454e4d5718e7eceb8e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "experiment_error_type_enum" AS ENUM('Database not reachable', 'Database auth fail', 'Error in the assignment algorithm', 'Parameter missing in the client request', 'Parameter not in the correct format', 'User ID not found', 'Query Failed', 'Error reported from client', 'Experiment user not defined', 'Experiment user group not defined', 'Working group is not a subset of user group', 'Invalid token', 'Token is not present in request', 'Error in migration', 'Email send error', 'Condition not found')`
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
      `CREATE INDEX "IDX_502b25664bcdd4b6721122faf0" ON "explicit_individual_assignment" ("experimentId") `
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
      `CREATE TABLE "group_enrollment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "experimentId" uuid, "partitionId" character varying, "conditionId" uuid, CONSTRAINT "PK_3d773718f69fca13135f2ab4769" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_ae99aafabd65ee3251d59e1f5b" ON "group_enrollment" ("experimentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_151c40ca733232929477532903" ON "group_enrollment" ("partitionId") `);
    await queryRunner.query(
      `CREATE TYPE "group_exclusion_exclusioncode_enum" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect')`
    );
    await queryRunner.query(
      `CREATE TABLE "group_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "exclusionCode" "group_exclusion_exclusioncode_enum", "groupId" character varying NOT NULL, "experimentId" uuid, CONSTRAINT "PK_eab94b00f9762d7484c606840e0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_15ae48e288f94c0aab841cd807" ON "group_exclusion" ("experimentId") `);
    await queryRunner.query(
      `CREATE TYPE "individual_enrollment_enrollmentcode_enum" AS ENUM('participant enrolled via algorithm', 'participant enrolled due to group enrollment')`
    );
    await queryRunner.query(
      `CREATE TABLE "individual_enrollment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying, "enrollmentCode" "individual_enrollment_enrollmentcode_enum", "experimentId" uuid, "partitionId" character varying, "userId" character varying, "conditionId" uuid, CONSTRAINT "PK_51a228f5bfaf0961e1e33ba1fdb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bc8c85db258f328c7af93346e" ON "individual_enrollment" ("experimentId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6b061b4c2e9cf33b19aea73e7" ON "individual_enrollment" ("partitionId") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_b4575e2a0c125578c9744492c7" ON "individual_enrollment" ("userId") `);
    await queryRunner.query(
      `CREATE TYPE "individual_exclusion_exclusioncode_enum" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect')`
    );
    await queryRunner.query(
      `CREATE TABLE "individual_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "exclusionCode" "individual_exclusion_exclusioncode_enum", "experimentId" uuid, "userId" character varying, CONSTRAINT "PK_2084e00363f40f96ce81ad788b6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "monitored_decision_point_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "monitoredDecisionPointId" character varying, CONSTRAINT "PK_2fa4825c93a748b4e62553a46fe" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "monitored_decision_point" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "decisionPoint" character varying NOT NULL, "condition" character varying, "userId" character varying, CONSTRAINT "PK_7fd52382a1b12f6d55ec2cc674d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2bb5acceb92a29fd022c5ff30" ON "monitored_decision_point" ("decisionPoint") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_be1ade8096668d342a8d37e812" ON "monitored_decision_point" ("userId") `);
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
      `CREATE TABLE "segment_for_segment" ("childSegmentId" uuid NOT NULL, "parentSegmentId" uuid NOT NULL, CONSTRAINT "PK_e4606af021f20ee98736d83d2fa" PRIMARY KEY ("childSegmentId", "parentSegmentId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cbe54e77df890c36415493e98" ON "segment_for_segment" ("childSegmentId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb101a942537f1fc0a7ef7994c" ON "segment_for_segment" ("parentSegmentId") `
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_condition" ADD CONSTRAINT "FK_390a67a227a832e28d48d33607e" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
      `ALTER TABLE "state_time_log" ADD CONSTRAINT "FK_aa0df63ad4adcf2e827eaad3338" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_915022e01487b0245a16cbc55f3" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_for_segment" ADD CONSTRAINT "FK_715bbd2f483a715789a991123eb" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_for_segment" ADD CONSTRAINT "FK_cb84433b17891682f9a77126754" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_95161b8f3f8284268fd3af07f17" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "decision_point" ADD CONSTRAINT "FK_a12b2ac5e10ea27d692b43fd80c" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
      `ALTER TABLE "group_enrollment" ADD CONSTRAINT "FK_ae99aafabd65ee3251d59e1f5b0" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_enrollment" ADD CONSTRAINT "FK_151c40ca733232929477532903a" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_enrollment" ADD CONSTRAINT "FK_7479d73940ffee4afce253b3061" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "group_exclusion" ADD CONSTRAINT "FK_15ae48e288f94c0aab841cd8073" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_enrollment" ADD CONSTRAINT "FK_6bc8c85db258f328c7af93346e9" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_enrollment" ADD CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73" FOREIGN KEY ("partitionId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_enrollment" ADD CONSTRAINT "FK_b4575e2a0c125578c9744492c7c" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_enrollment" ADD CONSTRAINT "FK_4f4d2f2ec491226d4692ed400fc" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_exclusion" ADD CONSTRAINT "FK_43238be19de9500c290393b9078" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "individual_exclusion" ADD CONSTRAINT "FK_de26ba8251f4ebf8b9c8ccf6236" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "monitored_decision_point_log" ADD CONSTRAINT "FK_4e9bf07b07327c60523614ceed0" FOREIGN KEY ("monitoredDecisionPointId") REFERENCES "monitored_decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "monitored_decision_point" ADD CONSTRAINT "FK_be1ade8096668d342a8d37e8129" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_job" ADD CONSTRAINT "FK_8b449f6d80b8378f792c1a6bee2" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "metric_log" ADD CONSTRAINT "FK_81c6609c523e34b8f001cad7170" FOREIGN KEY ("metricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "metric_log" ADD CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c" FOREIGN KEY ("logId") REFERENCES "log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_7cbe54e77df890c36415493e981" FOREIGN KEY ("childSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4" FOREIGN KEY ("parentSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4"`);
    await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_7cbe54e77df890c36415493e981"`);
    await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c"`);
    await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_81c6609c523e34b8f001cad7170"`);
    await queryRunner.query(`ALTER TABLE "scheduled_job" DROP CONSTRAINT "FK_8b449f6d80b8378f792c1a6bee2"`);
    await queryRunner.query(`ALTER TABLE "monitored_decision_point" DROP CONSTRAINT "FK_be1ade8096668d342a8d37e8129"`);
    await queryRunner.query(
      `ALTER TABLE "monitored_decision_point_log" DROP CONSTRAINT "FK_4e9bf07b07327c60523614ceed0"`
    );
    await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP CONSTRAINT "FK_de26ba8251f4ebf8b9c8ccf6236"`);
    await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP CONSTRAINT "FK_43238be19de9500c290393b9078"`);
    await queryRunner.query(`ALTER TABLE "individual_enrollment" DROP CONSTRAINT "FK_4f4d2f2ec491226d4692ed400fc"`);
    await queryRunner.query(`ALTER TABLE "individual_enrollment" DROP CONSTRAINT "FK_b4575e2a0c125578c9744492c7c"`);
    await queryRunner.query(`ALTER TABLE "individual_enrollment" DROP CONSTRAINT "FK_c6b061b4c2e9cf33b19aea73e73"`);
    await queryRunner.query(`ALTER TABLE "individual_enrollment" DROP CONSTRAINT "FK_6bc8c85db258f328c7af93346e9"`);
    await queryRunner.query(`ALTER TABLE "group_exclusion" DROP CONSTRAINT "FK_15ae48e288f94c0aab841cd8073"`);
    await queryRunner.query(`ALTER TABLE "group_enrollment" DROP CONSTRAINT "FK_7479d73940ffee4afce253b3061"`);
    await queryRunner.query(`ALTER TABLE "group_enrollment" DROP CONSTRAINT "FK_151c40ca733232929477532903a"`);
    await queryRunner.query(`ALTER TABLE "group_enrollment" DROP CONSTRAINT "FK_ae99aafabd65ee3251d59e1f5b0"`);
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
    await queryRunner.query(`ALTER TABLE "decision_point" DROP CONSTRAINT "FK_a12b2ac5e10ea27d692b43fd80c"`);
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_95161b8f3f8284268fd3af07f17"`
    );
    await queryRunner.query(`ALTER TABLE "individual_for_segment" DROP CONSTRAINT "FK_cb84433b17891682f9a77126754"`);
    await queryRunner.query(`ALTER TABLE "group_for_segment" DROP CONSTRAINT "FK_715bbd2f483a715789a991123eb"`);
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_915022e01487b0245a16cbc55f3"`
    );
    await queryRunner.query(`ALTER TABLE "state_time_log" DROP CONSTRAINT "FK_aa0df63ad4adcf2e827eaad3338"`);
    await queryRunner.query(`ALTER TABLE "query" DROP CONSTRAINT "FK_80e30ce407c8e0555a6ad46d659"`);
    await queryRunner.query(`ALTER TABLE "query" DROP CONSTRAINT "FK_16b236f2ca1472930abdbaf048a"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_cea2ed3a494729d4b21edbd2983"`);
    await queryRunner.query(`ALTER TABLE "experiment_user" DROP CONSTRAINT "FK_f1d4193d241e06d2de07527c980"`);
    await queryRunner.query(`ALTER TABLE "experiment_condition" DROP CONSTRAINT "FK_390a67a227a832e28d48d33607e"`);
    await queryRunner.query(`DROP INDEX "IDX_cb101a942537f1fc0a7ef7994c"`);
    await queryRunner.query(`DROP INDEX "IDX_7cbe54e77df890c36415493e98"`);
    await queryRunner.query(`DROP TABLE "segment_for_segment"`);
    await queryRunner.query(`DROP INDEX "IDX_c022cd84fd9fa789cbaee40b41"`);
    await queryRunner.query(`DROP INDEX "IDX_81c6609c523e34b8f001cad717"`);
    await queryRunner.query(`DROP TABLE "metric_log"`);
    await queryRunner.query(`DROP TABLE "setting"`);
    await queryRunner.query(`DROP TABLE "scheduled_job"`);
    await queryRunner.query(`DROP INDEX "IDX_be1ade8096668d342a8d37e812"`);
    await queryRunner.query(`DROP INDEX "IDX_c2bb5acceb92a29fd022c5ff30"`);
    await queryRunner.query(`DROP TABLE "monitored_decision_point"`);
    await queryRunner.query(`DROP TABLE "monitored_decision_point_log"`);
    await queryRunner.query(`DROP TABLE "individual_exclusion"`);
    await queryRunner.query(`DROP TYPE "individual_exclusion_exclusioncode_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_b4575e2a0c125578c9744492c7"`);
    await queryRunner.query(`DROP INDEX "IDX_c6b061b4c2e9cf33b19aea73e7"`);
    await queryRunner.query(`DROP INDEX "IDX_6bc8c85db258f328c7af93346e"`);
    await queryRunner.query(`DROP TABLE "individual_enrollment"`);
    await queryRunner.query(`DROP TYPE "individual_enrollment_enrollmentcode_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_15ae48e288f94c0aab841cd807"`);
    await queryRunner.query(`DROP TABLE "group_exclusion"`);
    await queryRunner.query(`DROP TYPE "group_exclusion_exclusioncode_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_151c40ca733232929477532903"`);
    await queryRunner.query(`DROP INDEX "IDX_ae99aafabd65ee3251d59e1f5b"`);
    await queryRunner.query(`DROP TABLE "group_enrollment"`);
    await queryRunner.query(`DROP TABLE "feature_flag"`);
    await queryRunner.query(`DROP TABLE "flag_variation"`);
    await queryRunner.query(`DROP TABLE "explicit_individual_exclusion"`);
    await queryRunner.query(`DROP INDEX "IDX_502b25664bcdd4b6721122faf0"`);
    await queryRunner.query(`DROP TABLE "explicit_individual_assignment"`);
    await queryRunner.query(`DROP TABLE "preview_user"`);
    await queryRunner.query(`DROP TABLE "explicit_group_exclusion"`);
    await queryRunner.query(`DROP TABLE "experiment_error"`);
    await queryRunner.query(`DROP TYPE "experiment_error_type_enum"`);
    await queryRunner.query(`DROP TABLE "experiment_audit_log"`);
    await queryRunner.query(`DROP TYPE "experiment_audit_log_type_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "decision_point"`);
    await queryRunner.query(`DROP TABLE "experiment"`);
    await queryRunner.query(`DROP TYPE "experiment_filtermode_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_postexperimentrule_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_assignmentunit_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_consistencyrule_enum"`);
    await queryRunner.query(`DROP TYPE "experiment_state_enum"`);
    await queryRunner.query(`DROP TABLE "experiment_segment_inclusion"`);
    await queryRunner.query(`DROP TABLE "segment"`);
    await queryRunner.query(`DROP TYPE "segment_type_enum"`);
    await queryRunner.query(`DROP TABLE "individual_for_segment"`);
    await queryRunner.query(`DROP TABLE "group_for_segment"`);
    await queryRunner.query(`DROP TABLE "experiment_segment_exclusion"`);
    await queryRunner.query(`DROP TABLE "state_time_log"`);
    await queryRunner.query(`DROP TYPE "state_time_log_tostate_enum"`);
    await queryRunner.query(`DROP TYPE "state_time_log_fromstate_enum"`);
    await queryRunner.query(`DROP TABLE "query"`);
    await queryRunner.query(`DROP TYPE "query_repeatedmeasure_enum"`);
    await queryRunner.query(`DROP TABLE "metric"`);
    await queryRunner.query(`DROP TYPE "metric_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_cea2ed3a494729d4b21edbd298"`);
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`DROP TABLE "experiment_user"`);
    await queryRunner.query(`DROP TABLE "experiment_condition"`);
  }
}
