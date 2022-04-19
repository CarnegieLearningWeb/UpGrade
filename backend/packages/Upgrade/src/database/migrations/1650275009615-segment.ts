import {MigrationInterface, QueryRunner} from "typeorm";

export class segment1650275009615 implements MigrationInterface {
    name = 'segment1650275009615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "individual_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "userId" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_0a965e751d45b5921549274a65c" PRIMARY KEY ("userId", "segmentId"))`);
        await queryRunner.query(`CREATE TYPE "segment_type_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying , "context" character varying NOT NULL, "type" "segment_type_enum" NOT NULL DEFAULT 'public', CONSTRAINT "PK_d648ac58d8e0532689dfb8ad7ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_for_segment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "groupId" character varying NOT NULL, "type" character varying NOT NULL, "segmentId" uuid NOT NULL, CONSTRAINT "PK_831eaa3563190f840db9ebe4f95" PRIMARY KEY ("groupId", "type", "segmentId"))`);
        await queryRunner.query(`CREATE TABLE "segment_for_segment" ("childSegmentId" uuid NOT NULL, "parentSegmentId" uuid NOT NULL, CONSTRAINT "PK_a74451152fc94f6f13fffe905a9" PRIMARY KEY ("childSegmentId", "parentSegmentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b221ab10ed4c8a63d7ac7120" ON "segment_for_segment" ("childSegmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_964d09e429ea16e9f8f8ac439c" ON "segment_for_segment" ("parentSegmentId") `);
        await queryRunner.query(`ALTER TABLE "individual_for_segment" ADD CONSTRAINT "FK_cb84433b17891682f9a77126754" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_for_segment" ADD CONSTRAINT "FK_715bbd2f483a715789a991123eb" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_87b221ab10ed4c8a63d7ac7120e" FOREIGN KEY ("childSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" ADD CONSTRAINT "FK_964d09e429ea16e9f8f8ac439c6" FOREIGN KEY ("parentSegmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_964d09e429ea16e9f8f8ac439c6"`);
        await queryRunner.query(`ALTER TABLE "segment_for_segment" DROP CONSTRAINT "FK_87b221ab10ed4c8a63d7ac7120e"`);
        await queryRunner.query(`ALTER TABLE "group_for_segment" DROP CONSTRAINT "FK_715bbd2f483a715789a991123eb"`);
        await queryRunner.query(`ALTER TABLE "individual_for_segment" DROP CONSTRAINT "FK_cb84433b17891682f9a77126754"`);
        await queryRunner.query(`DROP INDEX "IDX_964d09e429ea16e9f8f8ac439c"`);
        await queryRunner.query(`DROP INDEX "IDX_87b221ab10ed4c8a63d7ac7120"`);
        await queryRunner.query(`DROP TABLE "segment_for_segment"`);
        await queryRunner.query(`DROP TABLE "group_for_segment"`);
        await queryRunner.query(`DROP TABLE "segment"`);
        await queryRunner.query(`DROP TYPE "segment_type_enum"`);
        await queryRunner.query(`DROP TABLE "individual_for_segment"`);
    }

}
