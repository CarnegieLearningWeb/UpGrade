import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagSegmentInclusionExclusion1711566460836 implements MigrationInterface {
  name = 'featureFlagSegmentInclusionExclusion1711566460836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feature_flag_segment_inclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "featureFlagId" uuid NOT NULL, CONSTRAINT "REL_e0abd5d8d0200b9e4d2fecf139" UNIQUE ("segmentId"), CONSTRAINT "REL_e9d3d49c9779b47390961eb1cf" UNIQUE ("featureFlagId"), CONSTRAINT "PK_c1d54498ada310a4d93e9b158d2" PRIMARY KEY ("segmentId", "featureFlagId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "feature_flag_segment_exclusion" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "segmentId" uuid NOT NULL, "featureFlagId" uuid NOT NULL, CONSTRAINT "REL_b592d039e8ae2eed7a00c89cab" UNIQUE ("segmentId"), CONSTRAINT "REL_d45d8b0089b0965c79b57fe84e" UNIQUE ("featureFlagId"), CONSTRAINT "PK_b81176ab3b0e31527d7cc23db78" PRIMARY KEY ("segmentId", "featureFlagId"))`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e"`
    );
    await queryRunner.query(`DROP TABLE "feature_flag_segment_exclusion"`);
    await queryRunner.query(`DROP TABLE "feature_flag_segment_inclusion"`);
  }
}
