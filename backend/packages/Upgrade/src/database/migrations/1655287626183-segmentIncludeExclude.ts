import {MigrationInterface, QueryRunner} from "typeorm";

export class segmentIncludeExclude1655287626183 implements MigrationInterface {
    name = 'segmentIncludeExclude1655287626183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "experiment_segment_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_915022e01487b0245a16cbc55f" UNIQUE ("segmentId"), CONSTRAINT "REL_7d22a811ae04d2ed1b8af0e9c0" UNIQUE ("experimentId"), CONSTRAINT "PK_54747bc2fc0d9a509f551371b60" PRIMARY KEY ("segmentId", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "group_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_831eaa3563190f840db9ebe4f95" PRIMARY KEY ("groupId", "type", "segmentId"))`);
        await queryRunner.query(`CREATE TABLE "individual_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_0a965e751d45b5921549274a65c" PRIMARY KEY ("userId", "segmentId"))`);
        await queryRunner.query(`CREATE TYPE "segment_type_enum" AS ENUM('public', 'private', 'global_exclude')`);
        await queryRunner.query(`CREATE TABLE "segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "context" character varying NOT NULL, "type" "segment_type_enum" NOT NULL DEFAULT 'public', CONSTRAINT "PK_d648ac58d8e0532689dfb8ad7ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "experiment_segment_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_95161b8f3f8284268fd3af07f1" UNIQUE ("segmentId"), CONSTRAINT "REL_f9e3c925808cc88fe34cafa0ec" UNIQUE ("experimentId"), CONSTRAINT "PK_b3f79c9b9aae99668e0c9860b97" PRIMARY KEY ("segmentId", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "segment_for_segment" ("childSegmentId" uuid NOT NULL, "parentSegmentId" uuid NOT NULL, CONSTRAINT "PK_e4606af021f20ee98736d83d2fa" PRIMARY KEY ("childSegmentId", "parentSegmentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7cbe54e77df890c36415493e98" ON "segment_for_segment" ("childSegmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb101a942537f1fc0a7ef7994c" ON "segment_for_segment" ("parentSegmentId") `);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_915022e01487b0245a16cbc55f3" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_for_segment" ADD CONSTRAINT "FK_715bbd2f483a715789a991123eb" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "individual_for_segment" ADD CONSTRAINT "FK_cb84433b17891682f9a77126754" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_95161b8f3f8284268fd3af07f17" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_7cbe54e77df890c36415493e981" FOREIGN KEY ("childSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4" FOREIGN KEY ("parentSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4"`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_7cbe54e77df890c36415493e981"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_95161b8f3f8284268fd3af07f17"`);
        await queryRunner.query(`ALTER TABLE "individual_for_segment" DROP CONSTRAINT "FK_cb84433b17891682f9a77126754"`);
        await queryRunner.query(`ALTER TABLE "group_for_segment" DROP CONSTRAINT "FK_715bbd2f483a715789a991123eb"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_915022e01487b0245a16cbc55f3"`);
        await queryRunner.query(`DROP INDEX "IDX_cb101a942537f1fc0a7ef7994c"`);
        await queryRunner.query(`DROP INDEX "IDX_7cbe54e77df890c36415493e98"`);
        await queryRunner.query(`DROP TABLE "segment_for_segment"`);
        await queryRunner.query(`DROP TABLE "experiment_segment_inclusion"`);
        await queryRunner.query(`DROP TABLE "segment"`);
        await queryRunner.query(`DROP TYPE "segment_type_enum"`);
        await queryRunner.query(`DROP TABLE "individual_for_segment"`);
        await queryRunner.query(`DROP TABLE "group_for_segment"`);
        await queryRunner.query(`DROP TABLE "experiment_segment_exclusion"`);
    }

}
