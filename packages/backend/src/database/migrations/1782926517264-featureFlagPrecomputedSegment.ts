import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeatureFlagPrecomputedSegment1782926517264 implements MigrationInterface {
  name = 'FeatureFlagPrecomputedSegment1782926517264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feature_flag_precomputed_segment" (
        "featureFlagId" uuid NOT NULL,
        "inclusionIds" text[] NOT NULL DEFAULT '{}',
        "exclusionIds" text[] NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_feature_flag_precomputed_segment" PRIMARY KEY ("featureFlagId"),
        CONSTRAINT "FK_feature_flag_precomputed_segment_feature_flag"
          FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feature_flag_precomputed_segment"`);
  }
}
