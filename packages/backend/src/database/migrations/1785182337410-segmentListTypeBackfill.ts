import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills "segment"."listType" for private segments (i.e. flag/experiment/segment lists).
 *
 * The column was added by SegmentListType1732740328832 but never populated for pre-existing
 * rows, so ExperimentService has had to infer a list's type at read time from its loaded
 * members. That inference is the only reason the experiment details page must load every
 * member of every list; with listType populated it can load member counts instead.
 *
 * The rules below mirror ExperimentService.inferListType exactly:
 *   - individuals only                                  -> 'individual'
 *   - groups only, all sharing one type that isn't 'All' -> that group type
 *   - sub-segments only                                  -> 'segment'
 * Anything mixed or empty is ambiguous and is left NULL, which preserves today's behaviour
 * for that data.
 *
 * Scoped to type = 'private' because those are the only segments whose listType is consumed.
 */
export class SegmentListTypeBackfill1785182337410 implements MigrationInterface {
  name = 'SegmentListTypeBackfill1785182337410';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "public"."segment" s
       SET "listType" = inferred."listType"
       FROM (
         SELECT
           seg.id,
           CASE
             WHEN individuals.count > 0 AND groups.count = 0 AND children.count = 0
               THEN 'individual'
             WHEN individuals.count = 0 AND groups.count > 0 AND children.count = 0
               AND groups."distinctTypes" = 1 AND groups."groupType" <> 'All'
               THEN groups."groupType"
             WHEN individuals.count = 0 AND groups.count = 0 AND children.count > 0
               THEN 'segment'
           END AS "listType"
         FROM "public"."segment" seg
         CROSS JOIN LATERAL (
           SELECT COUNT(*) AS count
           FROM "public"."individual_for_segment" ifs
           WHERE ifs."segmentId" = seg.id
         ) individuals
         CROSS JOIN LATERAL (
           SELECT
             COUNT(*) AS count,
             COUNT(DISTINCT gfs."type") AS "distinctTypes",
             MIN(gfs."type") AS "groupType"
           FROM "public"."group_for_segment" gfs
           WHERE gfs."segmentId" = seg.id
         ) groups
         CROSS JOIN LATERAL (
           SELECT COUNT(*) AS count
           FROM "public"."segment_for_segment" sfs
           WHERE sfs."parentSegmentId" = seg.id
         ) children
         WHERE seg."listType" IS NULL
           AND seg."type" = 'private'
       ) inferred
       WHERE s.id = inferred.id
         AND inferred."listType" IS NOT NULL`
    );
  }

  public async down(): Promise<void> {
    // Intentionally a no-op. listType is a derived value and this migration only ever writes
    // to rows where it was NULL, but it does not record which rows those were — so there is no
    // way to distinguish a value this migration wrote from one the application has since set.
    // Clearing the column wholesale would destroy legitimate data.
  }
}
