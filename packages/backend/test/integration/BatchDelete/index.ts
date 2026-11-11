import { randomUUID } from 'crypto';
import { Application } from 'express';
import request from 'supertest';
import Container from 'typedi';
import { createExpressServer } from 'routing-controllers';
import { DataSource, In } from 'typeorm';
import {
  ASSIGNMENT_ALGORITHM,
  ASSIGNMENT_UNIT,
  BatchDeleteEntity,
  CACHE_PREFIX,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  EXPERIMENT_STATE_INTERNAL_NAME_OVERRIDES,
  FEATURE_FLAG_STATUS,
  LOG_TYPE,
  POST_EXPERIMENT_RULE,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  SERVER_ERROR,
  STANDARD_LIST_TYPE,
  SYSTEM_USER_EMAIL,
  UserRole,
} from 'upgrade_types';
import { ExperimentController } from '../../../src/api/controllers/ExperimentController';
import { FeatureFlagsController } from '../../../src/api/controllers/FeatureFlagController';
import { SegmentController } from '../../../src/api/controllers/SegmentController';
import { ErrorHandlerMiddleware } from '../../../src/api/middlewares/ErrorHandlerMiddleware';
import { LogMiddleware } from '../../../src/api/middlewares/LogMiddleware';
import { ConditionPosteriorState } from '../../../src/api/models/ConditionPosteriorState';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentAuditLog } from '../../../src/api/models/ExperimentAuditLog';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { ExperimentPrecomputedSegment } from '../../../src/api/models/ExperimentPrecomputedSegment';
import { ExperimentSegmentInclusion } from '../../../src/api/models/ExperimentSegmentInclusion';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { Segment } from '../../../src/api/models/Segment';
import { ThompsonSamplingExperimentConfig } from '../../../src/api/models/ThompsonSamplingExperimentConfig';
import { ThompsonSamplingReward } from '../../../src/api/models/ThompsonSamplingReward';
import { User } from '../../../src/api/models/User';
import { DeletionRepository } from '../../../src/api/repositories/DeletionRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import { ExperimentPrecomputedSegmentService } from '../../../src/api/services/ExperimentPrecomputedSegmentService';
import { SegmentService, SegmentWithStatus } from '../../../src/api/services/SegmentService';
import { BatchDeleteService } from '../../../src/api/services/BatchDeleteService';
import { currentUserChecker } from '../../../src/auth/currentUserChecker';
import { env } from '../../../src/env';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { iocLoader } from '../../../src/loaders/iocLoader';

const entities: BatchDeleteEntity[] = ['experiments', 'flags', 'segments'];
const model = { experiments: Experiment, flags: FeatureFlag, segments: Segment };
const route = (entity: BatchDeleteEntity) => `/api/${entity}/batch-delete`;
const deletionAudit = { experiments: LOG_TYPE.EXPERIMENT_DELETED, flags: LOG_TYPE.FEATURE_FLAG_DELETED };
const storedStates = [
  ...new Set(Object.values(EXPERIMENT_STATE).map((state) => EXPERIMENT_STATE_INTERNAL_NAME_OVERRIDES[state] || state)),
];
const deletableStates = [
  EXPERIMENT_STATE.DRAFT,
  EXPERIMENT_STATE.INACTIVE,
  EXPERIMENT_STATE.CANCELLED,
  EXPERIMENT_STATE.ARCHIVED,
];

export function registerBatchDeleteTests(connections: () => [DataSource, DataSource]) {
  describe('Batch deletion', () => {
    let db: DataSource;
    let writer: DataSource;
    let app: Application;
    let originalAuth: boolean;
    beforeAll(() => {
      iocLoader();
      const { authorizationChecker } = jest.requireActual('../../../src/auth/authorizationChecker');
      app = createExpressServer({
        routePrefix: '/api',
        controllers: [ExperimentController, FeatureFlagsController, SegmentController],
        middlewares: [LogMiddleware, ErrorHandlerMiddleware],
        classTransformer: true,
        validation: { whitelist: true, validationError: { target: false, value: false } },
        defaultErrorHandler: false,
        authorizationChecker: authorizationChecker(),
        currentUserChecker,
      });
    });
    beforeEach(() => {
      [db, writer] = connections();
      originalAuth = env.google.authTokenRequired;
      env.google.authTokenRequired = false;
    });
    afterEach(() => {
      env.google.authTokenRequired = originalAuth;
      jest.restoreAllMocks();
    });

    const create = async (entity: BatchDeleteEntity, count = 1) => {
      const rows = Array.from({ length: count }, (_, i) => ({ id: randomUUID(), name: `Batch ${i}`, context: 'home' }));
      if (entity === 'experiments') {
        await db.getRepository(Experiment).insert(
          rows.map((row) => ({
            ...row,
            context: [row.context],
            description: '',
            assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
            postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
          }))
        );
      } else if (entity === 'flags') {
        await db.getRepository(FeatureFlag).insert(
          rows.map((row) => ({
            ...row,
            context: [row.context],
            key: row.id,
            description: '',
          }))
        );
      } else await db.getRepository(Segment).insert(rows.map((row) => ({ ...row, type: SEGMENT_TYPE.PUBLIC })));
      return rows;
    };
    const nativeExperimentData = async (experimentId: string) => {
      const conditionId = randomUUID();
      await db.getRepository(Experiment).update(experimentId, {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
      });
      await db.getRepository(ExperimentCondition).insert({
        id: conditionId,
        experiment: { id: experimentId },
        conditionCode: 'native-condition',
        assignmentWeight: 100,
      });
      await db.getRepository(ThompsonSamplingExperimentConfig).insert({ experimentId });
      await db.getRepository(ConditionPosteriorState).insert({ conditionId, successCount: 1, totalCount: 1 });
      await db.getRepository(ThompsonSamplingReward).insert({ conditionId, userId: 'batch-member', success: true });
      return conditionId;
    };
    const ownedList = async (entity: BatchDeleteEntity, ownerId: string, childId?: string, connection = db) => {
      const list = {
        id: randomUUID(),
        name: 'Owned list',
        context: 'home',
        type: SEGMENT_TYPE.PRIVATE,
        listType: childId ? STANDARD_LIST_TYPE.SEGMENT : STANDARD_LIST_TYPE.INDIVIDUAL,
      };
      await connection.getRepository(Segment).insert(list);
      await connection.getRepository(IndividualForSegment).insert({ segmentId: list.id, userId: 'batch-member' });
      if (childId) await connection.createQueryBuilder().relation(Segment, 'subSegments').of(list.id).add(childId);
      if (entity === 'experiments') {
        await connection
          .getRepository(ExperimentSegmentInclusion)
          .insert({ experimentId: ownerId, segmentId: list.id });
      } else if (entity === 'flags') {
        await connection.getRepository(FeatureFlagSegmentInclusion).insert({
          featureFlagId: ownerId,
          segmentId: list.id,
          listType: list.listType,
          enabled: false,
        });
      } else await connection.createQueryBuilder().relation(Segment, 'subSegments').of(ownerId).add(list.id);
      return list;
    };

    test.each(entities)('%s validates IDs and follows single-delete authentication', async (entity) => {
      const spy = jest.spyOn(Container.get(BatchDeleteService), 'delete');
      const id = randomUUID();
      for (const body of [
        {},
        { ids: null },
        { ids: id },
        { ids: [] },
        { ids: [null] },
        { ids: [123] },
        { ids: ['bad-id'] },
        { ids: [id, id] },
        { ids: [id, id.toUpperCase()] },
      ]) {
        await request(app).post(route(entity)).send(body).expect(400);
      }
      env.google.authTokenRequired = true;
      await request(app)
        .post(route(entity))
        .send({ ids: [id] })
        .expect(401);
      expect(spy).not.toHaveBeenCalled();

      // With authentication off and no system user there is no caller role, so nothing may be deleted.
      env.google.authTokenRequired = false;
      await db.getRepository(User).delete({ email: SYSTEM_USER_EMAIL });
      const [single, batch] = await create(entity, 2);
      await request(app).delete(`/api/${entity}/${single.id}`).expect(403);
      await request(app)
        .post(route(entity))
        .send({ ids: [batch.id] })
        .expect(403);
      expect(await db.getRepository(model[entity]).countBy({ id: In([single.id, batch.id]) })).toBe(2);
    });

    const permitted: Record<UserRole, BatchDeleteEntity[]> = {
      [UserRole.ADMIN]: ['experiments', 'flags', 'segments'],
      [UserRole.CREATOR]: ['experiments', 'flags', 'segments'],
      [UserRole.USER_MANAGER]: ['segments'],
      [UserRole.READER]: [],
    };
    test.each(Object.values(UserRole))('applies the %s role to single and batch deletion', async (role) => {
      await db.getRepository(User).update(SYSTEM_USER_EMAIL, { role });
      for (const entity of entities) {
        const [single, batch] = await create(entity, 2);
        if (permitted[role].includes(entity)) {
          await request(app).delete(`/api/${entity}/${single.id}`).expect(200);
          const { body } = await request(app)
            .post(route(entity))
            .send({ ids: [batch.id] })
            .expect(200);
          expect(body.results).toEqual([{ id: batch.id, outcome: 'deleted' }]);
          expect(await db.getRepository(model[entity]).countBy({ id: In([single.id, batch.id]) })).toBe(0);
        } else {
          await request(app).delete(`/api/${entity}/${single.id}`).expect(403);
          await request(app)
            .post(route(entity))
            .send({ ids: [batch.id] })
            .expect(403);
          expect(await db.getRepository(model[entity]).countBy({ id: In([single.id, batch.id]) })).toBe(2);
        }
      }
      expect(await db.getRepository(ExperimentAuditLog).countBy({ type: In(Object.values(deletionAudit)) })).toBe(
        permitted[role].filter((entity) => entity !== 'segments').length * 2
      );
    });

    test.each(entities)('%s deletes owned lists and members while preserving public children', async (entity) => {
      const rows = await create(entity, 2);
      const [child] = await create('segments');
      const lists = await Promise.all(rows.map((row) => ownedList(entity, row.id, child.id)));
      const ids = rows.map((row) => row.id.toUpperCase()).reverse();
      const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
      expect(body).toEqual({ results: ids.map((id) => ({ id, outcome: 'deleted' })) });
      expect(await db.getRepository(model[entity]).countBy({ id: In(ids) })).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: In(lists.map((list) => list.id)) })).toBe(0);
      expect(
        await db.getRepository(IndividualForSegment).countBy({ segmentId: In(lists.map((list) => list.id)) })
      ).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
    });

    test.each(entities)('%s deletes with one pooled connection', async (entity) => {
      const [row] = await create(entity);
      const list = await ownedList(entity, row.id);
      let experimentId: string;
      if (entity === 'segments') {
        // A list of an archived experiment does not make a segment Used, but its precomputed row still updates.
        const [experiment] = await create('experiments');
        experimentId = experiment.id;
        await db.getRepository(Experiment).update(experimentId, { state: EXPERIMENT_STATE.ARCHIVED });
        await ownedList('experiments', experimentId, row.id);
        await db.getRepository(IndividualForSegment).insert({ segmentId: row.id, userId: 'deleted-member' });
        const logger = new UpgradeLogger();
        await Container.get(ExperimentPrecomputedSegmentService).recomputeForExperiment(experimentId, logger);
        expect(await db.getRepository(ExperimentPrecomputedSegment).findOneBy({ experimentId })).toMatchObject({
          inclusionIds: expect.arrayContaining(['deleted-member']),
        });
      }
      const originalExtra = db.options.extra;
      await db.destroy();
      db.setOptions({ extra: { ...originalExtra, max: 1, connectionTimeoutMillis: 500 } });
      try {
        await db.initialize();
        if (entity === 'flags') {
          const { body: details } = await request(app).get(`/api/flags/${row.id}`).expect(200);
          expect(details.featureFlagSegmentInclusion[0].segment).toMatchObject({
            id: list.id,
            individualForSegmentCount: 1,
            groupForSegmentCount: 0,
          });
        }
        const { body } = await request(app)
          .post(route(entity))
          .send({ ids: [row.id] })
          .expect(200);
        expect(body.results).toEqual([{ id: row.id, outcome: 'deleted' }]);
        expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(0);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(0);
        if (entity === 'segments') {
          expect(await db.getRepository(ExperimentPrecomputedSegment).findOneBy({ experimentId })).toMatchObject({
            inclusionIds: ['batch-member'],
            exclusionIds: [],
          });
        }
      } finally {
        if (db.isInitialized) await db.destroy();
        db.setOptions({ extra: originalExtra });
        await db.initialize();
      }
    });

    test.each(entities)('%s skips a missing ID and deletes the remaining selection', async (entity) => {
      const [row] = await create(entity);
      const missing = randomUUID();
      const { body } = await request(app)
        .post(route(entity))
        .send({ ids: [row.id, missing] })
        .expect(200);
      expect(body).toEqual({
        results: [
          { id: row.id, outcome: 'deleted' },
          { id: missing, outcome: 'not_found', reasonCode: DeletionReasonCode.NOT_FOUND },
        ],
      });
      expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(0);
    });

    test.each(['cleanup', 'commit'])('rolls back flag deletion when %s fails', async (failureStage) => {
      const rows = await create('flags', 3);
      const list = await ownedList('flags', rows[1].id);
      const atCommit = failureStage === 'commit';
      try {
        await db.query(`CREATE OR REPLACE FUNCTION batch_test_reject_delete() RETURNS trigger AS $$
          BEGIN IF OLD.id = TG_ARGV[0]::uuid THEN RAISE EXCEPTION 'batch deletion failure'; END IF;
          RETURN OLD; END; $$ LANGUAGE plpgsql`);
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_delete ON segment');
        // Deferring this test-only trigger forces a commit failure after the audit has been written.
        const trigger = atCommit
          ? 'CREATE CONSTRAINT TRIGGER batch_test_reject_delete AFTER DELETE ON segment DEFERRABLE INITIALLY DEFERRED'
          : 'CREATE TRIGGER batch_test_reject_delete BEFORE DELETE ON segment';
        // The interpolated UUID is generated only by this fixture.
        await db.query(`${trigger} FOR EACH ROW EXECUTE FUNCTION batch_test_reject_delete('${list.id}')`);
        const { body } = await request(app)
          .post(route('flags'))
          .send({ ids: rows.map((row) => row.id) })
          .expect(200);
        expect(body).toEqual({
          results: [
            { id: rows[0].id, outcome: 'deleted' },
            {
              id: rows[1].id,
              outcome: atCommit ? 'unknown' : 'failed',
              reasonCode: atCommit ? DeletionReasonCode.OUTCOME_UNKNOWN : DeletionReasonCode.DELETE_FAILED,
            },
            { id: rows[2].id, outcome: 'not_attempted' },
          ],
        });
        expect(await db.getRepository(FeatureFlag).countBy({ id: rows[0].id })).toBe(0);
        expect(await db.getRepository(FeatureFlag).countBy({ id: In(rows.slice(1).map((row) => row.id)) })).toBe(2);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(1);
        expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(1);
        expect(await db.getRepository(FeatureFlagSegmentInclusion).countBy({ segmentId: list.id })).toBe(1);
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.FEATURE_FLAG_DELETED })).toBe(1);
      } finally {
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_delete ON segment');
        await db.query('DROP FUNCTION IF EXISTS batch_test_reject_delete()');
      }
    });

    test('rolls back an experiment after an audit insert failure and stops the remaining items', async () => {
      const rows = await create('experiments', 3);
      const list = await ownedList('experiments', rows[1].id);
      const conditionId = await nativeExperimentData(rows[1].id);
      try {
        await db.query(`CREATE OR REPLACE FUNCTION batch_test_reject_audit() RETURNS trigger AS $$
          BEGIN IF NEW.data->>'experimentId' = TG_ARGV[0] THEN RAISE EXCEPTION 'batch audit failure'; END IF;
          RETURN NEW; END; $$ LANGUAGE plpgsql`);
        // The interpolated UUID is generated only by this fixture.
        await db.query(`CREATE TRIGGER batch_test_reject_audit BEFORE INSERT ON experiment_audit_log
          FOR EACH ROW EXECUTE FUNCTION batch_test_reject_audit('${rows[1].id}')`);
        const { body } = await request(app)
          .post(route('experiments'))
          .send({ ids: rows.map((row) => row.id) })
          .expect(200);
        expect(body.results).toEqual([
          { id: rows[0].id, outcome: 'deleted' },
          { id: rows[1].id, outcome: 'failed', reasonCode: DeletionReasonCode.DELETE_FAILED },
          { id: rows[2].id, outcome: 'not_attempted' },
        ]);
        expect(await db.getRepository(Experiment).countBy({ id: rows[0].id })).toBe(0);
        expect(await db.getRepository(Experiment).countBy({ id: In(rows.slice(1).map((row) => row.id)) })).toBe(2);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(1);
        expect(await db.getRepository(ExperimentSegmentInclusion).countBy({ segmentId: list.id })).toBe(1);
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(1);
        expect(await db.getRepository(ExperimentCondition).countBy({ id: conditionId })).toBe(1);
        expect(await db.getRepository(ThompsonSamplingExperimentConfig).countBy({ experimentId: rows[1].id })).toBe(1);
        expect(await db.getRepository(ConditionPosteriorState).findOneBy({ conditionId })).toMatchObject({
          successCount: 1,
          totalCount: 1,
        });
        expect(await db.getRepository(ThompsonSamplingReward).findOneBy({ conditionId })).toMatchObject({
          userId: 'batch-member',
          success: true,
        });
      } finally {
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_audit ON experiment_audit_log');
        await db.query('DROP FUNCTION IF EXISTS batch_test_reject_audit()');
      }
    });

    test('reports a database-configured lock timeout without deleting', async () => {
      const [row] = await create('flags');
      const blocker = writer.createQueryRunner();
      await blocker.connect();
      await blocker.startTransaction();
      try {
        await blocker.query('SELECT id FROM feature_flag WHERE id = $1 FOR UPDATE', [row.id]);
        const original = db.createQueryRunner.bind(db);
        jest.spyOn(db, 'createQueryRunner').mockImplementation((...args) => {
          const runner = original(...args);
          const start = runner.startTransaction.bind(runner);
          jest.spyOn(runner, 'startTransaction').mockImplementation(async (...startArgs) => {
            await start(...startArgs);
            // Model a database-configured limit; the deletion service does not set its own timeout.
            await runner.query("SET LOCAL lock_timeout = '100ms'");
          });
          return runner;
        });
        const { body } = await request(app)
          .post(route('flags'))
          .send({ ids: [row.id] })
          .expect(200);
        expect(body.results).toEqual([{ id: row.id, outcome: 'failed', reasonCode: DeletionReasonCode.LOCK_TIMEOUT }]);
        expect(await db.getRepository(FeatureFlag).countBy({ id: row.id })).toBe(1);
      } finally {
        await blocker.rollbackTransaction();
        await blocker.release();
      }
    });

    test.each([false, true])('updates archived owners after segment deletion (recompute fails: %s)', async (fails) => {
      const rows = await create('segments', 2);
      const [experiment] = await create('experiments');
      await db.getRepository(Experiment).update(experiment.id, { state: EXPERIMENT_STATE.ARCHIVED });
      const members = rows.map((row) => `member-${row.id}`);
      await db
        .getRepository(IndividualForSegment)
        .insert(rows.map((row, index) => ({ segmentId: row.id, userId: members[index] })));
      await db
        .getRepository(ExperimentSegmentInclusion)
        .insert(rows.map((row) => ({ experimentId: experiment.id, segmentId: row.id })));
      const experiments = Container.get(ExperimentPrecomputedSegmentService);
      await experiments.recomputeForExperiment(experiment.id, new UpgradeLogger());
      if (fails) jest.spyOn(experiments, 'recomputeForExperiment').mockRejectedValueOnce(new Error('Recompute failed'));

      const { body } = await request(app)
        .post(route('segments'))
        .send({ ids: rows.map((row) => row.id) })
        .expect(200);
      if (fails) {
        expect(body.results).toEqual([
          { id: rows[0].id, outcome: 'deleted', reasonCode: DeletionReasonCode.POST_DELETE_FAILED },
          { id: rows[1].id, outcome: 'not_attempted' },
        ]);
        expect(await db.getRepository(Segment).countBy({ id: rows[0].id })).toBe(0);
        expect(await db.getRepository(Segment).countBy({ id: rows[1].id })).toBe(1);
      } else {
        expect(body.results).toEqual(rows.map((row) => ({ id: row.id, outcome: 'deleted' })));
        expect(
          await db.getRepository(ExperimentPrecomputedSegment).findOneBy({ experimentId: experiment.id })
        ).toMatchObject({
          inclusionIds: [],
          exclusionIds: [],
        });
      }
    });

    test.each(['single', 'batch'])(
      '%s deletion refuses a target that becomes ineligible before its deletion lock',
      async (mode) => {
        for (const entity of entities) {
          const [row] = await create(entity);
          const [flag] = await create('flags');
          const findForDeletion = DeletionRepository.prototype.findForDeletion;
          jest
            .spyOn(DeletionRepository.prototype, 'findForDeletion')
            .mockImplementationOnce(async function (this: DeletionRepository, ...args) {
              // Commit a change on another connection just before the deletion acquires its target lock.
              if (entity === 'experiments') {
                await writer.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.ENROLLING });
              } else if (entity === 'flags') {
                await writer.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
              } else {
                await ownedList('flags', flag.id, row.id, writer);
              }
              return findForDeletion.apply(this, args);
            });
          const reasonCode =
            entity === 'segments' ? DeletionReasonCode.SEGMENT_IN_USE : DeletionReasonCode.STATE_NOT_DELETABLE;
          if (mode === 'single') {
            const { body } = await request(app).delete(`/api/${entity}/${row.id}`).expect(409);
            expect(body).toMatchObject({
              type: SERVER_ERROR.DELETION_NOT_ALLOWED,
              message: expect.stringContaining(reasonCode),
            });
          } else {
            const { body } = await request(app)
              .post(route(entity))
              .send({ ids: [row.id] })
              .expect(200);
            expect(body.results).toEqual([{ id: row.id, outcome: 'refused', reasonCode }]);
          }
          expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(1);
          jest.restoreAllMocks();
        }
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: In(Object.values(deletionAudit)) })).toBe(0);
      }
    );

    test('keeps a committed segment deletion when post-commit cache invalidation fails', async () => {
      const rows = await create('segments', 2);
      const cache = Container.get(CacheService);
      const reset = cache.resetPrefixCache.bind(cache);
      let observedCount: number;
      jest.spyOn(cache, 'resetPrefixCache').mockImplementation(async (prefix) => {
        if (prefix === CACHE_PREFIX.SEGMENT_KEY_PREFIX) {
          observedCount = await writer.getRepository(Segment).countBy({ id: rows[0].id });
          throw new Error('Cache unavailable after commit');
        }
        return reset(prefix);
      });
      const { body } = await request(app)
        .post(route('segments'))
        .send({ ids: rows.map((row) => row.id) })
        .expect(200);
      expect(body.results).toEqual([
        { id: rows[0].id, outcome: 'deleted', reasonCode: DeletionReasonCode.POST_DELETE_FAILED },
        { id: rows[1].id, outcome: 'not_attempted' },
      ]);
      expect(observedCount).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: rows[1].id })).toBe(1);
    });

    test.each(['single', 'batch'])(
      '%s deletion cascades through native Thompson Sampling config, posteriors and rewards',
      async (mode) => {
        const [row] = await create('experiments');
        const conditionId = await nativeExperimentData(row.id);
        if (mode === 'single') {
          const { body } = await request(app).delete(`/api/experiments/${row.id}`).expect(200);
          expect(body).toEqual([expect.objectContaining({ id: row.id })]);
        } else {
          const { body } = await request(app)
            .post(route('experiments'))
            .send({ ids: [row.id] })
            .expect(200);
          expect(body.results).toEqual([{ id: row.id, outcome: 'deleted' }]);
        }
        expect(await db.getRepository(Experiment).countBy({ id: row.id })).toBe(0);
        expect(await db.getRepository(ExperimentCondition).countBy({ id: conditionId })).toBe(0);
        expect(await db.getRepository(ThompsonSamplingExperimentConfig).countBy({ experimentId: row.id })).toBe(0);
        expect(await db.getRepository(ConditionPosteriorState).countBy({ conditionId })).toBe(0);
        expect(await db.getRepository(ThompsonSamplingReward).countBy({ conditionId })).toBe(0);
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(1);
      }
    );

    test.each(entities)('%s single-delete route keeps its existing cleanup and success response', async (entity) => {
      const [row] = await create(entity);
      const [child] = await create('segments');
      const list = await ownedList(entity, row.id, child.id);
      const { body } = await request(app).delete(`/api/${entity}/${row.id}`).expect(200);
      expect(body).toEqual(
        entity === 'segments' ? expect.objectContaining({ id: row.id }) : [expect.objectContaining({ id: row.id })]
      );
      expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(0);
      expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
    });

    test.each(['single', 'batch'])('experiment %s deletion applies the experiment state rules', async (mode) => {
      const rows = await create('experiments', storedStates.length);
      for (const [index, row] of rows.entries()) {
        await db.getRepository(Experiment).update(row.id, { state: storedStates[index] });
      }
      const deletable = rows.filter((_, index) => deletableStates.includes(storedStates[index]));
      if (mode === 'single') {
        for (const [index, row] of rows.entries()) {
          await request(app)
            .delete(`/api/experiments/${row.id}`)
            .expect(deletableStates.includes(storedStates[index]) ? 200 : 409);
        }
      } else {
        const { body } = await request(app)
          .post(route('experiments'))
          .send({ ids: rows.map(({ id }) => id) })
          .expect(200);
        expect(body.results).toEqual(
          rows.map(({ id }, index) =>
            deletableStates.includes(storedStates[index])
              ? { id, outcome: 'deleted' }
              : { id, outcome: 'refused', reasonCode: DeletionReasonCode.STATE_NOT_DELETABLE }
          )
        );
      }
      const remaining = await db.getRepository(Experiment).findBy({ id: In(rows.map(({ id }) => id)) });
      expect(remaining.map(({ state }) => state).sort()).toEqual(
        storedStates.filter((state) => !deletableStates.includes(state)).sort()
      );
      expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(
        deletable.length
      );
    });

    test.each(['single', 'batch'])('%s deletion refuses Enabled flags and Used segments unchanged', async (mode) => {
      for (const entity of ['flags', 'segments'] as const) {
        const [row] = await create(entity);
        const list = await ownedList(entity, row.id);
        let reasonCode = DeletionReasonCode.STATE_NOT_DELETABLE;
        if (entity === 'flags') {
          await db.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
        } else {
          reasonCode = DeletionReasonCode.SEGMENT_IN_USE;
          const [owner] = await create('flags');
          await ownedList('flags', owner.id, row.id);
        }
        const reset = jest.spyOn(Container.get(CacheService), 'resetPrefixCache');
        if (mode === 'single') {
          await request(app).delete(`/api/${entity}/${row.id}`).expect(409);
        } else {
          const { body } = await request(app)
            .post(route(entity))
            .send({ ids: [row.id] })
            .expect(200);
          expect(body.results).toEqual([{ id: row.id, outcome: 'refused', reasonCode }]);
        }
        expect(reset).not.toHaveBeenCalled();
        expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(1);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(1);
        expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(1);
        jest.restoreAllMocks();
      }
      expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.FEATURE_FLAG_DELETED })).toBe(0);
    });

    test('segment usage follows the Used status: nested lists and active owners refuse, archived owners allow', async () => {
      const [parent, nested, viaExperiment, viaArchived] = await create('segments', 4);
      // A member of another segment's list is Used.
      await ownedList('segments', parent.id, nested.id);
      const [active, archived] = await create('experiments', 2);
      await db.getRepository(Experiment).update(archived.id, { state: EXPERIMENT_STATE.ARCHIVED });
      await ownedList('experiments', active.id, viaExperiment.id);
      await ownedList('experiments', archived.id, viaArchived.id);
      const ids = [nested.id, viaExperiment.id, viaArchived.id, parent.id];
      const { body } = await request(app).post(route('segments')).send({ ids }).expect(200);
      expect(body.results).toEqual([
        { id: nested.id, outcome: 'refused', reasonCode: DeletionReasonCode.SEGMENT_IN_USE },
        { id: viaExperiment.id, outcome: 'refused', reasonCode: DeletionReasonCode.SEGMENT_IN_USE },
        { id: viaArchived.id, outcome: 'deleted' },
        // Owning a list does not make the owner itself Used.
        { id: parent.id, outcome: 'deleted' },
      ]);
    });

    test('isSegmentInUse agrees with the Used status shown by getSegmentStatus', async () => {
      // The deletion policy evaluates one locked segment; the segment list labels every segment at once.
      // They are separate implementations of one rule, so pin them to each other across every kind of usage.
      const [unused, viaActive, viaArchived, viaFlag, owner, member, nestedMember, direct, viaGlobalExclude] =
        await create('segments', 9);
      const [active, archived] = await create('experiments', 2);
      await db.getRepository(Experiment).update(archived.id, { state: EXPERIMENT_STATE.ARCHIVED });
      const [flag] = await create('flags');
      await ownedList('experiments', active.id, viaActive.id);
      await ownedList('experiments', archived.id, viaArchived.id);
      await ownedList('flags', flag.id, viaFlag.id);
      await ownedList('segments', owner.id, member.id);
      await ownedList('segments', member.id, nestedMember.id);
      // A public segment attached directly to an experiment, without a private list in between.
      await db.getRepository(ExperimentSegmentInclusion).insert({ experimentId: active.id, segmentId: direct.id });
      const globalExclude = await db.getRepository(Segment).findOneBy({ type: SEGMENT_TYPE.GLOBAL_EXCLUDE });
      await ownedList('segments', globalExclude.id, viaGlobalExclude.id);

      const { segmentsData } = await Container.get(SegmentService).getAllSegmentWithStatus(new UpgradeLogger());
      const repository = new DeletionRepository(DeletionRepository, db.manager);
      const fixtures = [unused, viaActive, viaArchived, viaFlag, owner, member, nestedMember, direct, viaGlobalExclude];
      const statusUsed = fixtures.map(
        ({ id }) =>
          (segmentsData as SegmentWithStatus[]).find((segment) => segment.id === id)?.status === SEGMENT_STATUS.USED
      );
      const inUse = await Promise.all(fixtures.map(({ id }) => repository.isSegmentInUse(id, db.manager)));
      expect(inUse).toEqual(statusUsed);
      expect(statusUsed).toEqual([false, true, false, true, false, true, true, true, true]);
    });

    test('reports each item of a mixed batch truthfully and continues past refusals', async () => {
      const [deletable, running, last] = await create('experiments', 3);
      await db.getRepository(Experiment).update(running.id, { state: EXPERIMENT_STATE.ENROLLING });
      const missing = randomUUID();
      const ids = [deletable.id, running.id, missing, last.id];
      const { body } = await request(app).post(route('experiments')).send({ ids }).expect(200);
      expect(body.results).toEqual([
        { id: deletable.id, outcome: 'deleted' },
        { id: running.id, outcome: 'refused', reasonCode: DeletionReasonCode.STATE_NOT_DELETABLE },
        { id: missing, outcome: 'not_found', reasonCode: DeletionReasonCode.NOT_FOUND },
        { id: last.id, outcome: 'deleted' },
      ]);
      expect(await db.getRepository(Experiment).findOneBy({ id: running.id })).toMatchObject({
        state: EXPERIMENT_STATE.ENROLLING,
      });
    });

    test.each(entities)('%s single-delete preserves its original missing-target response', async (entity) => {
      const { body } = await request(app)
        .delete(`/api/${entity}/${randomUUID()}`)
        .expect(entity === 'segments' ? 500 : 404);
      if (entity === 'experiments') expect(body.message).toBe('Experiment not found.');
    });

    test.each(['single', 'batch'])(
      '%s deletion allows unused private segments and refuses global-exclude',
      async (mode) => {
        for (const type of [SEGMENT_TYPE.PRIVATE, SEGMENT_TYPE.GLOBAL_EXCLUDE]) {
          const [row] = await create('segments');
          await db.getRepository(Segment).update(row.id, { type });
          const refused = type === SEGMENT_TYPE.GLOBAL_EXCLUDE;
          if (mode === 'single') {
            await request(app)
              .delete(`/api/segments/${row.id}`)
              .expect(refused ? 409 : 200);
          } else {
            const { body } = await request(app)
              .post(route('segments'))
              .send({ ids: [row.id] })
              .expect(200);
            expect(body.results).toEqual([
              refused
                ? { id: row.id, outcome: 'refused', reasonCode: DeletionReasonCode.GLOBAL_EXCLUDE_PROTECTED }
                : { id: row.id, outcome: 'deleted' },
            ]);
          }
          expect(await db.getRepository(Segment).countBy({ id: row.id })).toBe(refused ? 1 : 0);
        }
      }
    );

    test.each(entities)(
      '%s private-list endpoint still deletes lists and preserves their public children',
      async (entity) => {
        const [owner] = await create(entity);
        const [child] = await create('segments');
        const list = await ownedList(entity, owner.id, child.id);
        const path = entity === 'segments' ? 'list' : 'inclusionList';
        await request(app)
          .delete(`/api/${entity}/${path}/${list.id}`)
          .send(entity === 'segments' ? { parentSegmentId: owner.id } : {})
          .expect(200);
        expect(await db.getRepository(model[entity]).countBy({ id: owner.id })).toBe(1);
        expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(0);
        expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(0);
      }
    );

    test.each(entities.flatMap((entity) => [20, 100, 500].map((count) => ({ entity, count }))))(
      '$entity deletes $count selections without global eligibility reads',
      async ({ entity, count }) => {
        const rows = await create(entity, count);
        const ids = rows.map((row) => row.id).reverse();
        const status = jest.spyOn(Container.get(SegmentService), 'getSegmentStatus');
        const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
        expect(body).toEqual({ results: ids.map((id) => ({ id, outcome: 'deleted' })) });
        expect(status).not.toHaveBeenCalled();
        expect(await db.getRepository(model[entity]).countBy({ id: In(ids) })).toBe(0);
      }
    );
  });
}
