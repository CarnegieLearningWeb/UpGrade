import { MigrationInterface, QueryRunner } from 'typeorm';

// The stored format of group IDs in feature_flag_precomputed_segment changed: group IDs are now
// namespaced with their group type (see precomputedGroupKey) instead of stored bare. Existing rows
// hold the old bare format and would silently stop matching, so clear the table. The startup
// backfill (backfillMissingFlags) then rebuilds every row in the new format. Until backfill
// completes, flags with a missing row fall back to on-the-fly resolution, so no wrong decisions are
// made in the interim.
export class ClearFeatureFlagPrecomputedSegment1782950400000 implements MigrationInterface {
  name = 'ClearFeatureFlagPrecomputedSegment1782950400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "feature_flag_precomputed_segment"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting the code reverts the stored format too; clear again so the (old-format) backfill rebuilds.
    await queryRunner.query(`DELETE FROM "feature_flag_precomputed_segment"`);
  }
}
