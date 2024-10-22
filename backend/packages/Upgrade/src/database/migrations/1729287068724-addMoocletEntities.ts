import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoocletEntities1729287068724 implements MigrationInterface {
    name = 'AddMoocletEntities1729287068724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mooclet_version_condition_map" ("id" SERIAL NOT NULL, "moocletExperimentRefId" uuid NOT NULL, "experimentConditionId" uuid NOT NULL, "moocletVersionId" integer NOT NULL, CONSTRAINT "PK_0723d7ad1cdc035f4adb5281727" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mooclet_experiment_ref" ("id" uuid NOT NULL, "experimentId" uuid, "moocletId" integer NOT NULL, "policyParametersId" integer, "variableId" integer, CONSTRAINT "REL_df88beb64b5be102b4637ef375" UNIQUE ("experimentId"), CONSTRAINT "PK_4b09b92ba15f54e38b226a442c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'ts_configurable')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
        await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);
        await queryRunner.query(`ALTER TABLE "mooclet_version_condition_map" ADD CONSTRAINT "FK_ba85ae6b31045cef3bbcb8a5427" FOREIGN KEY ("moocletExperimentRefId") REFERENCES "mooclet_experiment_ref"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mooclet_version_condition_map" ADD CONSTRAINT "FK_a813783ff9ff52828d7125bb3a1" FOREIGN KEY ("experimentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" ADD CONSTRAINT "FK_df88beb64b5be102b4637ef3756" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP CONSTRAINT "FK_df88beb64b5be102b4637ef3756"`);
        await queryRunner.query(`ALTER TABLE "mooclet_version_condition_map" DROP CONSTRAINT "FK_a813783ff9ff52828d7125bb3a1"`);
        await queryRunner.query(`ALTER TABLE "mooclet_version_condition_map" DROP CONSTRAINT "FK_ba85ae6b31045cef3bbcb8a5427"`);
        await queryRunner.query(`CREATE TYPE "public"."experiment_assignmentalgorithm_enum_old" AS ENUM('random', 'stratified random sampling')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum_old" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum_old"`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
        await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_assignmentalgorithm_enum_old" RENAME TO "experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`DROP TABLE "mooclet_experiment_ref"`);
        await queryRunner.query(`DROP TABLE "mooclet_version_condition_map"`);
    }

}
