import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrecomputedSegment1779500000000 implements MigrationInterface {
  name = 'PrecomputedSegment1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "precomputed_segment" (
        "featureFlagId" uuid NOT NULL,
        "inclusionIds" text[] NOT NULL DEFAULT '{}',
        "exclusionIds" text[] NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_precomputed_segment" PRIMARY KEY ("featureFlagId"),
        CONSTRAINT "FK_precomputed_segment_feature_flag"
          FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "precomputed_segment"`);
  }
}
