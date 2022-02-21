import { MigrationInterface, QueryRunner } from "typeorm";

export class experimentLevelInclusionAndExclusion1645107347161 implements MigrationInterface {
    public name = 'experimentLevelInclusionAndExclusion1645107347161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "explicit_experiment_group_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "PK_242853c81afc809efbb3a35d28d" PRIMARY KEY ("id", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "explicit_experiment_group_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" character varying NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "PK_89381fbe2883b3b8fd8b0207c84" PRIMARY KEY ("id", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "explicit_experiment_individual_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "PK_f8581673a763df1a1702cec57f5" PRIMARY KEY ("userId", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "explicit_experiment_individual_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "PK_757b62cf84e8ffd940f47d0a919" PRIMARY KEY ("userId", "experimentId"))`);
        await queryRunner.query(`CREATE TYPE "public"."experiment_filtermode_enum" AS ENUM('includeAll', 'excludeAll')`);
        await queryRunner.query(`ALTER TABLE "experiment" ADD "filterMode" "public"."experiment_filtermode_enum" NOT NULL DEFAULT 'includeAll'`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_group_exclusion" ADD CONSTRAINT "FK_2b27448c9c812f4b8034b9d9a83" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_group_inclusion" ADD CONSTRAINT "FK_715783397ec4bc97b1f66a3e804" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_individual_exclusion" ADD CONSTRAINT "FK_f6ad55b6af879555d3d8f0df5b8" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_individual_inclusion" ADD CONSTRAINT "FK_00a1d27140e6f49db66b3acccfc" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "explicit_experiment_individual_inclusion" DROP CONSTRAINT "FK_00a1d27140e6f49db66b3acccfc"`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_individual_exclusion" DROP CONSTRAINT "FK_f6ad55b6af879555d3d8f0df5b8"`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_group_inclusion" DROP CONSTRAINT "FK_715783397ec4bc97b1f66a3e804"`);
        await queryRunner.query(`ALTER TABLE "explicit_experiment_group_exclusion" DROP CONSTRAINT "FK_2b27448c9c812f4b8034b9d9a83"`);
        await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "filterMode"`);
        await queryRunner.query(`DROP TYPE "public"."experiment_filtermode_enum"`);
        await queryRunner.query(`DROP TABLE "explicit_experiment_individual_inclusion"`);
        await queryRunner.query(`DROP TABLE "explicit_experiment_individual_exclusion"`);
        await queryRunner.query(`DROP TABLE "explicit_experiment_group_inclusion"`);
        await queryRunner.query(`DROP TABLE "explicit_experiment_group_exclusion"`);
    }
}
