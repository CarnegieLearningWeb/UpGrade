import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `feature_flag_exposure_count` (one row per flag) so the feature flags list can read each flag's
 * unique-exposure count by primary key instead of running COUNT(*) over every `feature_flag_exposure`
 * row for that flag on each page load.
 *
 * The backfill reads the whole exposure table once. `feature_flag_exposure`'s primary key is
 * ("featureFlagId", "experimentUserId"), so COUNT(*) per flag is already the unique-user count.
 * The foreign key is added after the backfill so the lock it takes on `feature_flag` is held only
 * briefly at the end of the migration, not for the whole backfill.
 */
export class FeatureFlagExposureCount1794418860625 implements MigrationInterface {
  name = 'FeatureFlagExposureCount1794418860625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feature_flag_exposure_count" (
        "featureFlagId" uuid NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_feature_flag_exposure_count" PRIMARY KEY ("featureFlagId")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "feature_flag_exposure_count" ("featureFlagId", "count")
      SELECT "featureFlagId", COUNT(*)::int
      FROM "feature_flag_exposure"
      GROUP BY "featureFlagId"
    `);
    await queryRunner.query(`
      ALTER TABLE "feature_flag_exposure_count"
        ADD CONSTRAINT "FK_feature_flag_exposure_count_feature_flag"
        FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feature_flag_exposure_count"`);
  }
}
