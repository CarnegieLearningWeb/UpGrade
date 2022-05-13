import {MigrationInterface, QueryRunner} from "typeorm";

export class segmentInclusionExclusion1652431721260 implements MigrationInterface {
    name = 'segmentInclusionExclusion1652431721260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" DROP CONSTRAINT "FK_964d09e429ea16e9f8f8ac439c6"`);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" DROP CONSTRAINT "FK_87b221ab10ed4c8a63d7ac7120e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b221ab10ed4c8a63d7ac7120"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_964d09e429ea16e9f8f8ac439c"`);
        await queryRunner.query(`CREATE TABLE "experiment_segment_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_915022e01487b0245a16cbc55f" UNIQUE ("segmentId"), CONSTRAINT "REL_7d22a811ae04d2ed1b8af0e9c0" UNIQUE ("experimentId"), CONSTRAINT "PK_54747bc2fc0d9a509f551371b60" PRIMARY KEY ("segmentId", "experimentId"))`);
        await queryRunner.query(`CREATE TABLE "experiment_segment_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "experimentId" uuid NOT NULL, CONSTRAINT "REL_95161b8f3f8284268fd3af07f1" UNIQUE ("segmentId"), CONSTRAINT "REL_f9e3c925808cc88fe34cafa0ec" UNIQUE ("experimentId"), CONSTRAINT "PK_b3f79c9b9aae99668e0c9860b97" PRIMARY KEY ("segmentId", "experimentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7cbe54e77df890c36415493e98" ON "public"."segment_for_segment" ("childSegmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb101a942537f1fc0a7ef7994c" ON "public"."segment_for_segment" ("parentSegmentId") `);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_915022e01487b0245a16cbc55f3" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_95161b8f3f8284268fd3af07f17" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" ADD CONSTRAINT "FK_7cbe54e77df890c36415493e981" FOREIGN KEY ("childSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" ADD CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4" FOREIGN KEY ("parentSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" DROP CONSTRAINT "FK_cb101a942537f1fc0a7ef7994c4"`);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" DROP CONSTRAINT "FK_7cbe54e77df890c36415493e981"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_95161b8f3f8284268fd3af07f17"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05"`);
        await queryRunner.query(`ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_915022e01487b0245a16cbc55f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb101a942537f1fc0a7ef7994c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7cbe54e77df890c36415493e98"`);
        await queryRunner.query(`DROP TABLE "experiment_segment_inclusion"`);
        await queryRunner.query(`DROP TABLE "experiment_segment_exclusion"`);
        await queryRunner.query(`CREATE INDEX "IDX_964d09e429ea16e9f8f8ac439c" ON "public"."segment_for_segment" ("parentSegmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_87b221ab10ed4c8a63d7ac7120" ON "public"."segment_for_segment" ("childSegmentId") `);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" ADD CONSTRAINT "FK_87b221ab10ed4c8a63d7ac7120e" FOREIGN KEY ("childSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "public"."segment_for_segment" ADD CONSTRAINT "FK_964d09e429ea16e9f8f8ac439c6" FOREIGN KEY ("parentSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
