import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagSegmentLists1719942568545 implements MigrationInterface {
  name = 'featureFlagSegmentLists1719942568545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" ADD "enabled" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "segment" ADD "includedInFeatureFlagId" uuid`);
    await queryRunner.query(`ALTER TABLE "segment" ADD "excludedFromFeatureFlagId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_c18df25bcd3a77610d4437a4c22" FOREIGN KEY ("includedInFeatureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_25b7127a3c93bb93c62edbeb2c9" FOREIGN KEY ("excludedFromFeatureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`DROP TABLE "feature_flag_segment_exclusion"`);
    await queryRunner.query(`DROP TABLE "feature_flag_segment_inclusion"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP CONSTRAINT "FK_25b7127a3c93bb93c62edbeb2c9"`);
    await queryRunner.query(`ALTER TABLE "segment" DROP CONSTRAINT "FK_c18df25bcd3a77610d4437a4c22"`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "excludedFromFeatureFlagId"`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "includedInFeatureFlagId"`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "enabled"`);
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
}
