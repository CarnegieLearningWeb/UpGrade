-- =============================================================
-- Performance test seed — segment membership check comparison
-- Context: 'perf-test' (isolated from real data)
-- Run: psql -h localhost -p 5433 -U postgres -d postgres -f perf-test-seed.sql
-- =============================================================
--
-- IDs used (valid UUID v4 format — version bits 4xxx, variant bits 8xxx):
--   a0000001-0000-4000-8000-000000000001  segment: large (10k members)
--   a0000002-0000-4000-8000-000000000002  segment: parent (sub-segment tree)
--   a0000003-0000-4000-8000-000000000003  segment: sublist-1 (1k members)
--   a0000004-0000-4000-8000-000000000004  segment: sublist-2 (1k + test user)
--   b0000001-0000-4000-8000-000000000001  experiment
--   c0000001-0000-4000-8000-000000000001  experiment_condition
--   d0000001-0000-4000-8000-000000000001  decision_point
--   e0000001-0000-4000-8000-000000000001  feature_flag

-- -----------------------------------------------------------
-- 1. Large segment — 10,000 individual members
--    Test user 'perf-test-user' is member #5000.
--    This is the segment that kills performance in the old path.
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'perf-large-segment',
  '10k individual members — primary perf target',
  'perf-test',
  'public',
  NOW(), NOW(), 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT
  'a0000001-0000-4000-8000-000000000001',
  'perf-bulk-user-' || gs,
  NOW(), NOW(), 1
FROM generate_series(1, 4999) gs
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000001-0000-4000-8000-000000000001', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT
  'a0000001-0000-4000-8000-000000000001',
  'perf-bulk-user-' || gs,
  NOW(), NOW(), 1
FROM generate_series(5000, 10000) gs
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 2. Sub-segment tree — 2 private lists under one public parent
--    Each list has 1,000 members. Tests the batched recursion fix.
--    Test user is in sub-segment 2.
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000002-0000-4000-8000-000000000002', 'perf-parent-segment', 'Parent with two sub-lists',     'perf-test', 'public',  NOW(), NOW(), 1),
  ('a0000003-0000-4000-8000-000000000003', 'perf-sublist-1',      'Sub-list 1 (1k members)',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000004-0000-4000-8000-000000000004', 'perf-sublist-2',      'Sub-list 2 (1k + test user)',   'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

-- Wire sub-segments to parent via segment_for_segment junction table
-- (parentSegmentId = parent, childSegmentId = child/sub-segment)
INSERT INTO segment_for_segment ("parentSegmentId", "childSegmentId")
VALUES
  ('a0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003'),
  ('a0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000003-0000-4000-8000-000000000003', 'perf-sub1-user-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 1000) gs
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000004-0000-4000-8000-000000000004', 'perf-sub2-user-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 999) gs
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000004-0000-4000-8000-000000000004', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 3. Experiment — ENROLLING, EXCLUDE_ALL, uses the large segment as inclusion
--    Needs a condition and a decision point to return an assignment.
-- -----------------------------------------------------------
INSERT INTO experiment (
  id, name, description, context, state,
  "consistencyRule", "assignmentUnit", "postExperimentRule",
  "conditionOrder", "assignmentAlgorithm", "filterMode",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES (
  'b0000001-0000-4000-8000-000000000001',
  'perf-test-experiment',
  'Perf test — large inclusion segment',
  ARRAY['perf-test'],
  'enrolling',
  'individual', 'individual', 'continue',
  'random', 'random', 'excludeAll',
  NOW(), NOW(), 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiment_condition (
  id, "twoCharacterId", name, description, "conditionCode",
  "assignmentWeight", "order", "experimentId",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES (
  'c0000001-0000-4000-8000-000000000001',
  'C1', 'control', 'Control condition', 'control',
  1.0, 1, 'b0000001-0000-4000-8000-000000000001',
  NOW(), NOW(), 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_point (
  id, "twoCharacterId", site, target, description, "order",
  "excludeIfReached", "pendingActivation", "experimentId",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES (
  'd0000001-0000-4000-8000-000000000001',
  'D1', 'perf-site', 'perf-target', 'Perf test decision point',
  1, false, false,
  'b0000001-0000-4000-8000-000000000001',
  NOW(), NOW(), 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 4. Feature flag — ENABLED, EXCLUDE_ALL, uses the large segment as exclusion
--    (EXCLUDE_ALL means include everyone EXCEPT those in the exclusion segment.
--     Our test user IS in the segment, so they will be excluded — tests the path.)
-- -----------------------------------------------------------
INSERT INTO feature_flag (
  id, name, key, description, context, status, "filterMode",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES (
  'e0000001-0000-4000-8000-000000000001',
  'perf-test-flag',
  'perf-test-flag',
  'Perf test feature flag',
  ARRAY['perf-test'],
  'enabled',
  'excludeAll',
  NOW(), NOW(), 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'e0000001-0000-4000-8000-000000000001',
  true,
  'individual',
  NOW(), NOW(), 1
)
ON CONFLICT DO NOTHING;

-- =============================================================
-- ADDITIONAL EXPERIMENTS AND FEATURE FLAGS
-- 10 more experiments (b0000002–b0000011) + 10 more flags (e0000002–e0000011)
-- All in 'perf-test' context.
--
-- ClassId groups (for workingGroup metadata in API calls):
--   perf-class-1  — TEST USER's class (pass workingGroup: {classId: 'perf-class-1'})
--   perf-class-2 through perf-class-7 — other classes (user NOT in these)
--
-- perf-test-user assignment outcomes:
--   Experiments getting assignment : b0000002, b0000003, b0000004, b0000006, b0000007
--   Experiments excluded           : b0000005 (exclude-wins demo), b0000008, b0000009, b0000010, b0000011
--   Flags getting flag value       : e0000002, e0000003, e0000004, e0000005, e0000006
--   Flags excluded                 : e0000007 (exclude-wins demo), e0000008, e0000009, e0000010, e0000011
--
-- The "exclude-wins demo" experiments/flags (b0000005, e0000007):
--   filterMode=excludeAll, perf-test-user is on BOTH an inclusion AND an exclusion
--   list — exclusion takes priority, so the user is excluded despite being included.
-- =============================================================

-- -----------------------------------------------------------
-- 5. Private segments for Experiment b0000002
--    filterMode=excludeAll | 3 inclusion lists + 2 exclusion lists
--    Mix of individual userId and classId group members
--    perf-test-user in a0000005 (inclusion), NOT in any exclusion → GETS ASSIGNMENT
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000005-0000-4000-8000-000000000005', 'perf-exp2-inc1', 'Exp2 inclusion 1 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000006-0000-4000-8000-000000000006', 'perf-exp2-inc2', 'Exp2 inclusion 2 — classId groups',    'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000007-0000-4000-8000-000000000007', 'perf-exp2-inc3', 'Exp2 inclusion 3 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000008-0000-4000-8000-000000000008', 'perf-exp2-exc1', 'Exp2 exclusion 1 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000009-0000-4000-8000-000000000009', 'perf-exp2-exc2', 'Exp2 exclusion 2 — individuals',       'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000005-0000-4000-8000-000000000005', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000005-0000-4000-8000-000000000005', 'perf-seg5-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000006-0000-4000-8000-000000000006', 'perf-class-1', 'classId', NOW(), NOW(), 1),
  ('a0000006-0000-4000-8000-000000000006', 'perf-class-2', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000007-0000-4000-8000-000000000007', 'perf-seg7-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000008-0000-4000-8000-000000000008', 'perf-class-3', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000009-0000-4000-8000-000000000009', 'perf-seg9-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 6. Private segments for Experiment b0000003
--    filterMode=excludeAll | 2 inclusion lists + 3 exclusion lists
--    perf-test-user in a0000010 (inclusion), NOT in any exclusion → GETS ASSIGNMENT
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000010-0000-4000-8000-000000000010', 'perf-exp3-inc1', 'Exp3 inclusion 1 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000011-0000-4000-8000-000000000011', 'perf-exp3-inc2', 'Exp3 inclusion 2 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000012-0000-4000-8000-000000000012', 'perf-exp3-exc1', 'Exp3 exclusion 1 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000013-0000-4000-8000-000000000013', 'perf-exp3-exc2', 'Exp3 exclusion 2 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000014-0000-4000-8000-000000000014', 'perf-exp3-exc3', 'Exp3 exclusion 3 — individuals',       'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000010-0000-4000-8000-000000000010', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000010-0000-4000-8000-000000000010', 'perf-seg10-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000011-0000-4000-8000-000000000011', 'perf-class-1', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000012-0000-4000-8000-000000000012', 'perf-seg12-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000013-0000-4000-8000-000000000013', 'perf-class-3', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000014-0000-4000-8000-000000000014', 'perf-seg14-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 7. Private segments for Experiment b0000004
--    filterMode=excludeAll | 4 inclusion lists + 4 exclusion lists (8 total)
--    perf-test-user in a0000015 (inclusion), NOT in any exclusion → GETS ASSIGNMENT
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000015-0000-4000-8000-000000000015', 'perf-exp4-inc1', 'Exp4 inclusion 1 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000016-0000-4000-8000-000000000016', 'perf-exp4-inc2', 'Exp4 inclusion 2 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000017-0000-4000-8000-000000000017', 'perf-exp4-inc3', 'Exp4 inclusion 3 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000018-0000-4000-8000-000000000018', 'perf-exp4-inc4', 'Exp4 inclusion 4 — classId groups',    'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000019-0000-4000-8000-000000000019', 'perf-exp4-exc1', 'Exp4 exclusion 1 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000020-0000-4000-8000-000000000020', 'perf-exp4-exc2', 'Exp4 exclusion 2 — individuals',       'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000021-0000-4000-8000-000000000021', 'perf-exp4-exc3', 'Exp4 exclusion 3 — classId group',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000022-0000-4000-8000-000000000022', 'perf-exp4-exc4', 'Exp4 exclusion 4 — individuals',       'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000015-0000-4000-8000-000000000015', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000015-0000-4000-8000-000000000015', 'perf-seg15-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000016-0000-4000-8000-000000000016', 'perf-class-1', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000017-0000-4000-8000-000000000017', 'perf-seg17-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000018-0000-4000-8000-000000000018', 'perf-class-2', 'classId', NOW(), NOW(), 1),
  ('a0000018-0000-4000-8000-000000000018', 'perf-class-4', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000019-0000-4000-8000-000000000019', 'perf-class-5', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000020-0000-4000-8000-000000000020', 'perf-seg20-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000021-0000-4000-8000-000000000021', 'perf-class-6', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000022-0000-4000-8000-000000000022', 'perf-seg22-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 8. Private segments for Experiment b0000005 — EXCLUDE-WINS DEMO
--    filterMode=excludeAll | 2 inclusion lists + 1 exclusion list
--    perf-test-user is in BOTH a0000023 (inclusion) AND a0000025 (exclusion)
--    Exclusion takes priority → user EXCLUDED despite being on the inclusion list
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000023-0000-4000-8000-000000000023', 'perf-exp5-inc1', 'Exp5 inclusion 1 — individuals (incl. test-user)',           'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000024-0000-4000-8000-000000000024', 'perf-exp5-inc2', 'Exp5 inclusion 2 — classId group',                           'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000025-0000-4000-8000-000000000025', 'perf-exp5-exc1', 'Exp5 exclusion 1 — individuals (test-user: exclude wins!)',   'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000023-0000-4000-8000-000000000023', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000023-0000-4000-8000-000000000023', 'perf-seg23-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000024-0000-4000-8000-000000000024', 'perf-class-1', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000025-0000-4000-8000-000000000025', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000025-0000-4000-8000-000000000025', 'perf-seg25-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 9. Private segments for remaining experiments b0000006–b0000011
-- -----------------------------------------------------------
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000026-0000-4000-8000-000000000026', 'perf-exp6-inc1',  'Exp6 inclusion — individuals (test-user)',              'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000027-0000-4000-8000-000000000027', 'perf-exp7-inc1',  'Exp7 inclusion — individuals (test-user)',              'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000028-0000-4000-8000-000000000028', 'perf-exp8-exc1',  'Exp8 exclusion — individuals (test-user)',              'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000029-0000-4000-8000-000000000029', 'perf-exp9-exc1',  'Exp9 exclusion — individuals (not test-user)',          'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000030-0000-4000-8000-000000000030', 'perf-exp10-exc1', 'Exp10 exclusion — individuals (test-user)',             'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000031-0000-4000-8000-000000000031', 'perf-exp11-inc1', 'Exp11 inclusion — individuals (not test-user)',         'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000026-0000-4000-8000-000000000026', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000026-0000-4000-8000-000000000026', 'perf-seg26-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000027-0000-4000-8000-000000000027', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000027-0000-4000-8000-000000000027', 'perf-seg27-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000028-0000-4000-8000-000000000028', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000029-0000-4000-8000-000000000029', 'perf-seg29-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000030-0000-4000-8000-000000000030', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000031-0000-4000-8000-000000000031', 'perf-seg31-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 10. Experiments b0000002–b0000011
-- -----------------------------------------------------------
INSERT INTO experiment (
  id, name, description, context, state,
  "consistencyRule", "assignmentUnit", "postExperimentRule",
  "conditionOrder", "assignmentAlgorithm", "filterMode",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES
  ('b0000002-0000-4000-8000-000000000002', 'perf-exp-02', 'Perf exp 02 — 5 private lists, excludeAll, user included',     ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000003-0000-4000-8000-000000000003', 'perf-exp-03', 'Perf exp 03 — 5 private lists, excludeAll, user included',     ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000004-0000-4000-8000-000000000004', 'perf-exp-04', 'Perf exp 04 — 8 private lists, excludeAll, user included',     ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000005-0000-4000-8000-000000000005', 'perf-exp-05', 'Perf exp 05 — excludeAll, user on inc+exc → EXCLUDED',         ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000006-0000-4000-8000-000000000006', 'perf-exp-06', 'Perf exp 06 — excludeAll, user in inclusion → included',       ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000007-0000-4000-8000-000000000007', 'perf-exp-07', 'Perf exp 07 — excludeAll, user in inclusion → included',       ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000008-0000-4000-8000-000000000008', 'perf-exp-08', 'Perf exp 08 — includeAll, user in exclusion → EXCLUDED',       ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','includeAll', NOW(),NOW(),1),
  ('b0000009-0000-4000-8000-000000000009', 'perf-exp-09', 'Perf exp 09 — excludeAll, no inclusion for user → EXCLUDED',   ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1),
  ('b0000010-0000-4000-8000-000000000010', 'perf-exp-10', 'Perf exp 10 — includeAll, user in exclusion → EXCLUDED',       ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','includeAll', NOW(),NOW(),1),
  ('b0000011-0000-4000-8000-000000000011', 'perf-exp-11', 'Perf exp 11 — excludeAll, user not in inclusion → EXCLUDED',   ARRAY['perf-test'], 'enrolling', 'individual','individual','continue','random','random','excludeAll', NOW(),NOW(),1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiment_condition (
  id, "twoCharacterId", name, description, "conditionCode",
  "assignmentWeight", "order", "experimentId",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES
  ('c0000002-0000-4000-8000-000000000002', 'C2', 'control', 'Control', 'control', 1.0, 1, 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1),
  ('c0000003-0000-4000-8000-000000000003', 'C3', 'control', 'Control', 'control', 1.0, 1, 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1),
  ('c0000004-0000-4000-8000-000000000004', 'C4', 'control', 'Control', 'control', 1.0, 1, 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('c0000005-0000-4000-8000-000000000005', 'C5', 'control', 'Control', 'control', 1.0, 1, 'b0000005-0000-4000-8000-000000000005', NOW(),NOW(),1),
  ('c0000006-0000-4000-8000-000000000006', 'C6', 'control', 'Control', 'control', 1.0, 1, 'b0000006-0000-4000-8000-000000000006', NOW(),NOW(),1),
  ('c0000007-0000-4000-8000-000000000007', 'C7', 'control', 'Control', 'control', 1.0, 1, 'b0000007-0000-4000-8000-000000000007', NOW(),NOW(),1),
  ('c0000008-0000-4000-8000-000000000008', 'C8', 'control', 'Control', 'control', 1.0, 1, 'b0000008-0000-4000-8000-000000000008', NOW(),NOW(),1),
  ('c0000009-0000-4000-8000-000000000009', 'C9', 'control', 'Control', 'control', 1.0, 1, 'b0000009-0000-4000-8000-000000000009', NOW(),NOW(),1),
  ('c0000010-0000-4000-8000-000000000010', 'CA', 'control', 'Control', 'control', 1.0, 1, 'b0000010-0000-4000-8000-000000000010', NOW(),NOW(),1),
  ('c0000011-0000-4000-8000-000000000011', 'CB', 'control', 'Control', 'control', 1.0, 1, 'b0000011-0000-4000-8000-000000000011', NOW(),NOW(),1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_point (
  id, "twoCharacterId", site, target, description, "order",
  "excludeIfReached", "pendingActivation", "experimentId",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES
  ('d0000002-0000-4000-8000-000000000002', 'D2', 'perf-site', 'perf-target-02', 'Decision point exp 02', 1, false, false, 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1),
  ('d0000003-0000-4000-8000-000000000003', 'D3', 'perf-site', 'perf-target-03', 'Decision point exp 03', 1, false, false, 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1),
  ('d0000004-0000-4000-8000-000000000004', 'D4', 'perf-site', 'perf-target-04', 'Decision point exp 04', 1, false, false, 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('d0000005-0000-4000-8000-000000000005', 'D5', 'perf-site', 'perf-target-05', 'Decision point exp 05', 1, false, false, 'b0000005-0000-4000-8000-000000000005', NOW(),NOW(),1),
  ('d0000006-0000-4000-8000-000000000006', 'D6', 'perf-site', 'perf-target-06', 'Decision point exp 06', 1, false, false, 'b0000006-0000-4000-8000-000000000006', NOW(),NOW(),1),
  ('d0000007-0000-4000-8000-000000000007', 'D7', 'perf-site', 'perf-target-07', 'Decision point exp 07', 1, false, false, 'b0000007-0000-4000-8000-000000000007', NOW(),NOW(),1),
  ('d0000008-0000-4000-8000-000000000008', 'D8', 'perf-site', 'perf-target-08', 'Decision point exp 08', 1, false, false, 'b0000008-0000-4000-8000-000000000008', NOW(),NOW(),1),
  ('d0000009-0000-4000-8000-000000000009', 'D9', 'perf-site', 'perf-target-09', 'Decision point exp 09', 1, false, false, 'b0000009-0000-4000-8000-000000000009', NOW(),NOW(),1),
  ('d0000010-0000-4000-8000-000000000010', 'DA', 'perf-site', 'perf-target-10', 'Decision point exp 10', 1, false, false, 'b0000010-0000-4000-8000-000000000010', NOW(),NOW(),1),
  ('d0000011-0000-4000-8000-000000000011', 'DB', 'perf-site', 'perf-target-11', 'Decision point exp 11', 1, false, false, 'b0000011-0000-4000-8000-000000000011', NOW(),NOW(),1)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- 11. Inclusion/Exclusion wiring for experiments b0000002–b0000011
-- -----------------------------------------------------------

-- b0000002: inc a5,a6,a7 | exc a8,a9
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000005-0000-4000-8000-000000000005', 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1),
  ('a0000006-0000-4000-8000-000000000006', 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1),
  ('a0000007-0000-4000-8000-000000000007', 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000008-0000-4000-8000-000000000008', 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1),
  ('a0000009-0000-4000-8000-000000000009', 'b0000002-0000-4000-8000-000000000002', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000003: inc a10,a11 | exc a12,a13,a14
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000010-0000-4000-8000-000000000010', 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1),
  ('a0000011-0000-4000-8000-000000000011', 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000012-0000-4000-8000-000000000012', 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1),
  ('a0000013-0000-4000-8000-000000000013', 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1),
  ('a0000014-0000-4000-8000-000000000014', 'b0000003-0000-4000-8000-000000000003', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000004: inc a15,a16,a17,a18 | exc a19,a20,a21,a22
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000015-0000-4000-8000-000000000015', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000016-0000-4000-8000-000000000016', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000017-0000-4000-8000-000000000017', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000018-0000-4000-8000-000000000018', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000019-0000-4000-8000-000000000019', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000020-0000-4000-8000-000000000020', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000021-0000-4000-8000-000000000021', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1),
  ('a0000022-0000-4000-8000-000000000022', 'b0000004-0000-4000-8000-000000000004', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000005 (exclude-wins demo): inc a23,a24 | exc a25 (test-user in both a23+a25)
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000023-0000-4000-8000-000000000023', 'b0000005-0000-4000-8000-000000000005', NOW(),NOW(),1),
  ('a0000024-0000-4000-8000-000000000024', 'b0000005-0000-4000-8000-000000000005', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000025-0000-4000-8000-000000000025', 'b0000005-0000-4000-8000-000000000005', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000006: inc a26 (test-user)
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000026-0000-4000-8000-000000000026', 'b0000006-0000-4000-8000-000000000006', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000007: inc a27 (test-user)
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000027-0000-4000-8000-000000000027', 'b0000007-0000-4000-8000-000000000007', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000008: exc a28 (test-user), includeAll → test-user excluded
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000028-0000-4000-8000-000000000028', 'b0000008-0000-4000-8000-000000000008', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000009: exc a29 (not test-user), excludeAll + no inclusion → test-user excluded by default
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000029-0000-4000-8000-000000000029', 'b0000009-0000-4000-8000-000000000009', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000010: exc a30 (test-user), includeAll → test-user excluded
INSERT INTO experiment_segment_exclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000030-0000-4000-8000-000000000030', 'b0000010-0000-4000-8000-000000000010', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- b0000011: inc a31 (not test-user), excludeAll → test-user not in inclusion → excluded
INSERT INTO experiment_segment_inclusion ("segmentId", "experimentId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000031-0000-4000-8000-000000000031', 'b0000011-0000-4000-8000-000000000011', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 12. Private segments for Feature Flags e0000002–e0000011
-- -----------------------------------------------------------

-- e0000002: filterMode=excludeAll, 3 inc + 2 exc, user gets flag
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000032-0000-4000-8000-000000000032', 'perf-flag2-inc1', 'Flag2 inclusion 1 — individuals',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000033-0000-4000-8000-000000000033', 'perf-flag2-inc2', 'Flag2 inclusion 2 — classId group',   'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000034-0000-4000-8000-000000000034', 'perf-flag2-inc3', 'Flag2 inclusion 3 — individuals',     'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000035-0000-4000-8000-000000000035', 'perf-flag2-exc1', 'Flag2 exclusion 1 — classId group',   'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000036-0000-4000-8000-000000000036', 'perf-flag2-exc2', 'Flag2 exclusion 2 — individuals',     'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000032-0000-4000-8000-000000000032', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000032-0000-4000-8000-000000000032', 'perf-seg32-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 30) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000033-0000-4000-8000-000000000033', 'perf-class-1', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000034-0000-4000-8000-000000000034', 'perf-seg34-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 30) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000035-0000-4000-8000-000000000035', 'perf-class-3', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000036-0000-4000-8000-000000000036', 'perf-seg36-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

-- e0000003: filterMode=excludeAll, 1 inc + 1 exc, user gets flag
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000037-0000-4000-8000-000000000037', 'perf-flag3-inc1', 'Flag3 inclusion — individuals',               'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000038-0000-4000-8000-000000000038', 'perf-flag3-exc1', 'Flag3 exclusion — classId (not user''s class)','perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000037-0000-4000-8000-000000000037', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000037-0000-4000-8000-000000000037', 'perf-seg37-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000038-0000-4000-8000-000000000038', 'perf-class-5', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- e0000004: filterMode=includeAll, 1 exc (not test-user), user gets flag
-- e0000005: filterMode=includeAll, 1 exc (classId not user's), user gets flag
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000039-0000-4000-8000-000000000039', 'perf-flag4-exc1', 'Flag4 exclusion — individuals (not test-user)',      'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000040-0000-4000-8000-000000000040', 'perf-flag5-exc1', 'Flag5 exclusion — classId group (not user''s class)','perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000039-0000-4000-8000-000000000039', 'perf-seg39-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000040-0000-4000-8000-000000000040', 'perf-class-5', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- e0000006: filterMode=excludeAll, 1 inc (test-user), user gets flag
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000041-0000-4000-8000-000000000041', 'perf-flag6-inc1', 'Flag6 inclusion — individuals', 'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000041-0000-4000-8000-000000000041', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000041-0000-4000-8000-000000000041', 'perf-seg41-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

-- e0000007: EXCLUDE-WINS DEMO — filterMode=excludeAll, test-user on BOTH inc AND exc → EXCLUDED
-- 2 inclusion lists + 2 exclusion lists
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000042-0000-4000-8000-000000000042', 'perf-flag7-inc1', 'Flag7 inclusion 1 — individuals (incl. test-user)',         'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000043-0000-4000-8000-000000000043', 'perf-flag7-inc2', 'Flag7 inclusion 2 — classId group',                         'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000044-0000-4000-8000-000000000044', 'perf-flag7-exc1', 'Flag7 exclusion 1 — individuals (test-user: exclude wins!)', 'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000045-0000-4000-8000-000000000045', 'perf-flag7-exc2', 'Flag7 exclusion 2 — classId group',                         'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000042-0000-4000-8000-000000000042', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000042-0000-4000-8000-000000000042', 'perf-seg42-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 20) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000043-0000-4000-8000-000000000043', 'perf-class-1', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000044-0000-4000-8000-000000000044', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;
INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000044-0000-4000-8000-000000000044', 'perf-seg44-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO group_for_segment ("segmentId", "groupId", type, "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000045-0000-4000-8000-000000000045', 'perf-class-7', 'classId', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- e0000008, e0000009, e0000011: exclusion segments
INSERT INTO segment (id, name, description, context, type, "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000046-0000-4000-8000-000000000046', 'perf-flag8-exc1',  'Flag8 exclusion — test-user',                   'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000047-0000-4000-8000-000000000047', 'perf-flag9-inc1',  'Flag9 inclusion — individuals (not test-user)', 'perf-test', 'private', NOW(), NOW(), 1),
  ('a0000048-0000-4000-8000-000000000048', 'perf-flag11-exc1', 'Flag11 exclusion — test-user',                  'perf-test', 'private', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000046-0000-4000-8000-000000000046', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
SELECT 'a0000047-0000-4000-8000-000000000047', 'perf-seg47-u-' || gs, NOW(), NOW(), 1
FROM generate_series(1, 10) gs ON CONFLICT DO NOTHING;

INSERT INTO individual_for_segment ("segmentId", "userId", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000048-0000-4000-8000-000000000048', 'perf-test-user', NOW(), NOW(), 1)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- 13. Feature flags e0000002–e0000011
-- -----------------------------------------------------------
INSERT INTO feature_flag (
  id, name, key, description, context, status, "filterMode",
  "createdAt", "updatedAt", "versionNumber"
)
VALUES
  ('e0000002-0000-4000-8000-000000000002', 'perf-flag-02', 'perf-flag-02', 'Perf flag 02 — 5 private lists, excludeAll, user included',     ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000003-0000-4000-8000-000000000003', 'perf-flag-03', 'perf-flag-03', 'Perf flag 03 — 2 private lists, excludeAll, user included',     ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000004-0000-4000-8000-000000000004', 'perf-flag-04', 'perf-flag-04', 'Perf flag 04 — includeAll, user not in exclusion → included',   ARRAY['perf-test'], 'enabled', 'includeAll', NOW(),NOW(),1),
  ('e0000005-0000-4000-8000-000000000005', 'perf-flag-05', 'perf-flag-05', 'Perf flag 05 — includeAll, user not in exclusion → included',   ARRAY['perf-test'], 'enabled', 'includeAll', NOW(),NOW(),1),
  ('e0000006-0000-4000-8000-000000000006', 'perf-flag-06', 'perf-flag-06', 'Perf flag 06 — excludeAll, user in inclusion → included',       ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000007-0000-4000-8000-000000000007', 'perf-flag-07', 'perf-flag-07', 'Perf flag 07 — excludeAll, user on inc+exc → EXCLUDED',         ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000008-0000-4000-8000-000000000008', 'perf-flag-08', 'perf-flag-08', 'Perf flag 08 — includeAll, user in exclusion → EXCLUDED',       ARRAY['perf-test'], 'enabled', 'includeAll', NOW(),NOW(),1),
  ('e0000009-0000-4000-8000-000000000009', 'perf-flag-09', 'perf-flag-09', 'Perf flag 09 — excludeAll, user not in inclusion → EXCLUDED',   ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000010-0000-4000-8000-000000000010', 'perf-flag-10', 'perf-flag-10', 'Perf flag 10 — excludeAll, no inclusions → EXCLUDED',           ARRAY['perf-test'], 'enabled', 'excludeAll', NOW(),NOW(),1),
  ('e0000011-0000-4000-8000-000000000011', 'perf-flag-11', 'perf-flag-11', 'Perf flag 11 — includeAll, user in exclusion → EXCLUDED',       ARRAY['perf-test'], 'enabled', 'includeAll', NOW(),NOW(),1)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- 14. Inclusion/Exclusion wiring for feature flags e0000002–e0000011
-- -----------------------------------------------------------

-- e0000002: inc a32,a33,a34 | exc a35,a36
INSERT INTO feature_flag_segment_inclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000032-0000-4000-8000-000000000032', 'e0000002-0000-4000-8000-000000000002', true, 'individual', NOW(),NOW(),1),
  ('a0000033-0000-4000-8000-000000000033', 'e0000002-0000-4000-8000-000000000002', true, 'group',      NOW(),NOW(),1),
  ('a0000034-0000-4000-8000-000000000034', 'e0000002-0000-4000-8000-000000000002', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000035-0000-4000-8000-000000000035', 'e0000002-0000-4000-8000-000000000002', true, 'group',      NOW(),NOW(),1),
  ('a0000036-0000-4000-8000-000000000036', 'e0000002-0000-4000-8000-000000000002', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000003: inc a37 | exc a38
INSERT INTO feature_flag_segment_inclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000037-0000-4000-8000-000000000037', 'e0000003-0000-4000-8000-000000000003', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000038-0000-4000-8000-000000000038', 'e0000003-0000-4000-8000-000000000003', true, 'group',      NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000004: exc a39 (not test-user); includeAll → user included
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000039-0000-4000-8000-000000000039', 'e0000004-0000-4000-8000-000000000004', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000005: exc a40 (classId group, not user's class); includeAll → user included
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000040-0000-4000-8000-000000000040', 'e0000005-0000-4000-8000-000000000005', true, 'group',      NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000006: inc a41 (test-user)
INSERT INTO feature_flag_segment_inclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000041-0000-4000-8000-000000000041', 'e0000006-0000-4000-8000-000000000006', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000007 (exclude-wins demo): inc a42,a43 | exc a44,a45 (test-user in a42 AND a44)
INSERT INTO feature_flag_segment_inclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000042-0000-4000-8000-000000000042', 'e0000007-0000-4000-8000-000000000007', true, 'individual', NOW(),NOW(),1),
  ('a0000043-0000-4000-8000-000000000043', 'e0000007-0000-4000-8000-000000000007', true, 'group',      NOW(),NOW(),1)
ON CONFLICT DO NOTHING;
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES
  ('a0000044-0000-4000-8000-000000000044', 'e0000007-0000-4000-8000-000000000007', true, 'individual', NOW(),NOW(),1),
  ('a0000045-0000-4000-8000-000000000045', 'e0000007-0000-4000-8000-000000000007', true, 'group',      NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000008: exc a46 (test-user); includeAll → test-user excluded
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000046-0000-4000-8000-000000000046', 'e0000008-0000-4000-8000-000000000008', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000009: inc a47 (not test-user); excludeAll → test-user not in inclusion → excluded
INSERT INTO feature_flag_segment_inclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000047-0000-4000-8000-000000000047', 'e0000009-0000-4000-8000-000000000009', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- e0000010: no segments; excludeAll → test-user excluded by default

-- e0000011: exc a48 (test-user); includeAll → test-user excluded
INSERT INTO feature_flag_segment_exclusion ("segmentId", "featureFlagId", enabled, "listType", "createdAt", "updatedAt", "versionNumber")
VALUES ('a0000048-0000-4000-8000-000000000048', 'e0000011-0000-4000-8000-000000000011', true, 'individual', NOW(),NOW(),1)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- Teardown (run separately if needed)
-- -----------------------------------------------------------
-- DELETE FROM individual_for_segment WHERE "segmentId" IN (
--   'a0000001-0000-4000-8000-000000000001','a0000003-0000-4000-8000-000000000003','a0000004-0000-4000-8000-000000000004',
--   'a0000005-0000-4000-8000-000000000005','a0000007-0000-4000-8000-000000000007','a0000009-0000-4000-8000-000000000009',
--   'a0000010-0000-4000-8000-000000000010','a0000012-0000-4000-8000-000000000012','a0000014-0000-4000-8000-000000000014',
--   'a0000015-0000-4000-8000-000000000015','a0000017-0000-4000-8000-000000000017','a0000020-0000-4000-8000-000000000020',
--   'a0000022-0000-4000-8000-000000000022','a0000023-0000-4000-8000-000000000023','a0000025-0000-4000-8000-000000000025',
--   'a0000026-0000-4000-8000-000000000026','a0000027-0000-4000-8000-000000000027','a0000028-0000-4000-8000-000000000028',
--   'a0000029-0000-4000-8000-000000000029','a0000030-0000-4000-8000-000000000030','a0000031-0000-4000-8000-000000000031',
--   'a0000032-0000-4000-8000-000000000032','a0000034-0000-4000-8000-000000000034','a0000036-0000-4000-8000-000000000036',
--   'a0000037-0000-4000-8000-000000000037','a0000039-0000-4000-8000-000000000039','a0000041-0000-4000-8000-000000000041',
--   'a0000042-0000-4000-8000-000000000042','a0000044-0000-4000-8000-000000000044','a0000046-0000-4000-8000-000000000046',
--   'a0000047-0000-4000-8000-000000000047','a0000048-0000-4000-8000-000000000048'
-- );
-- DELETE FROM group_for_segment WHERE "segmentId" IN (
--   'a0000006-0000-4000-8000-000000000006','a0000008-0000-4000-8000-000000000008',
--   'a0000011-0000-4000-8000-000000000011','a0000013-0000-4000-8000-000000000013',
--   'a0000016-0000-4000-8000-000000000016','a0000018-0000-4000-8000-000000000018',
--   'a0000019-0000-4000-8000-000000000019','a0000021-0000-4000-8000-000000000021',
--   'a0000024-0000-4000-8000-000000000024','a0000033-0000-4000-8000-000000000033',
--   'a0000035-0000-4000-8000-000000000035','a0000038-0000-4000-8000-000000000038',
--   'a0000040-0000-4000-8000-000000000040','a0000043-0000-4000-8000-000000000043',
--   'a0000045-0000-4000-8000-000000000045'
-- );
-- DELETE FROM segment_for_segment WHERE "parentSegmentId" = 'a0000002-0000-4000-8000-000000000002';
-- DELETE FROM experiment_segment_inclusion WHERE "experimentId" IN (SELECT id FROM experiment WHERE context @> ARRAY['perf-test']);
-- DELETE FROM experiment_segment_exclusion WHERE "experimentId" IN (SELECT id FROM experiment WHERE context @> ARRAY['perf-test']);
-- DELETE FROM feature_flag_segment_inclusion WHERE "featureFlagId" IN (SELECT id FROM feature_flag WHERE context @> ARRAY['perf-test']);
-- DELETE FROM feature_flag_segment_exclusion WHERE "featureFlagId" IN (SELECT id FROM feature_flag WHERE context @> ARRAY['perf-test']);
-- DELETE FROM experiment_condition WHERE "experimentId" IN (SELECT id FROM experiment WHERE context @> ARRAY['perf-test']);
-- DELETE FROM decision_point WHERE "experimentId" IN (SELECT id FROM experiment WHERE context @> ARRAY['perf-test']);
-- DELETE FROM experiment WHERE context @> ARRAY['perf-test'];
-- DELETE FROM feature_flag WHERE context @> ARRAY['perf-test'];
-- DELETE FROM segment WHERE context = 'perf-test';
