SELECT
  "segment"."createdAt"    AS "segment_createdAt",
  "segment"."updatedAt"    AS "segment_updatedAt",
  "segment"."versionNumber" AS "segment_versionNu
  "segment"."id"           AS "segment_id",
  "segment"."name"         AS "segment_name",
  "segment"."description"  AS "segment_description",
  "segment"."listType"     AS "segment_listType",
  "segment"."context"      AS "segment_context",
  "segment"."type"         AS "segment_type",
  "segment"."tags"         AS "segment_tags",

  "individualForSegment"."createdAt"    AS "individualForSegment_createdAt",
  "individualForSegment"."updatedAt"    AS "indiv
  "individualForSegment"."versionNumber" AS "individualForSegment_versionNumber",
  "individualForSegment"."segmentId"    AS "indiv
  "individualForSegment"."userId"       AS "individualForSegment_userId",

  "groupForSegment"."createdAt"    AS "groupForSegment_createdAt",
  "groupForSegment"."updatedAt"    AS "groupForSe
  "groupForSegment"."versionNumber" AS "groupForSegment_versionNumber",
  "groupForSegment"."segmentId"    AS "groupForSe
  "groupForSegment"."groupId"      AS "groupForSegment_groupId",
  "groupForSegment"."type"         AS "groupForSe

  "subSegment"."createdAt"    AS "subSegment_crea
  "subSegment"."updatedAt"    AS "subSegment_updatedAt",
  "subSegment"."versionNumber" AS "subSegment_ver
  "subSegment"."id"           AS "subSegment_id",
  "subSegment"."name"         AS "subSegment_name
  "subSegment"."description"  AS "subSegment_description",
  "subSegment"."listType"     AS "subSegment_list
  "subSegment"."context"      AS "subSegment_context",
  "subSegment"."type"         AS "subSegment_type",
  "subSegment"."tags"         AS "subSegment_tags"

FROM "segment" "segment"
LEFT JOIN "individual_for_segment" "individualForSegment"
  ON "individualForSegment"."segmentId" = "segment"."id"
LEFT JOIN "group_for_segment" "groupForSegment"
  ON "groupForSegment"."segmentId" = "segment"."id"
LEFT JOIN "segment_for_segment" "segment_subSegment"       
  ON "segment_subSegment"."parentSegmentId" = "segment"."id"
LEFT JOIN "segment" "subSegment"
  ON "subSegment"."id" = "segment_subSegment"."childSegmentId"
LEFT JOIN "experiment_segment_inclusion" "experimentSegmentInclusion"
  ON "experimentSegmentInclusion"."segmentId" = "segment"."id"
LEFT JOIN "experiment_segment_exclusion" "experimentSegmentExclusion"
  ON "experimentSegmentExclusion"."segmentId" = "segment"."id"
WHERE "segment"."id" IN (5ac59d2c-5391-4e7f-98b2-b35e71c0ea86
5ac59d2c-5391-4e7f-98b2-b35e71c0ea86)