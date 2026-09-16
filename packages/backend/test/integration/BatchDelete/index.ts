import { randomUUID } from 'crypto';
import { Application } from 'express';
import request from 'supertest';
import Container from 'typedi';
import { createExpressServer } from 'routing-controllers';
import { DataSource, In } from 'typeorm';
import {
  ASSIGNMENT_UNIT,
  BatchDeleteEntity,
  CACHE_PREFIX,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  EXPERIMENT_STATE_INTERNAL_NAME_OVERRIDES,
  FEATURE_FLAG_STATUS,
  LOG_TYPE,
  POST_EXPERIMENT_RULE,
  SEGMENT_TYPE,
  STANDARD_LIST_TYPE,
  SYSTEM_USER_EMAIL,
  UserRole,
} from 'upgrade_types';
import { ExperimentController } from '../../../src/api/controllers/ExperimentController';
import { FeatureFlagsController } from '../../../src/api/controllers/FeatureFlagController';
import { SegmentController } from '../../../src/api/controllers/SegmentController';
import { ErrorHandlerMiddleware } from '../../../src/api/middlewares/ErrorHandlerMiddleware';
import { LogMiddleware } from '../../../src/api/middlewares/LogMiddleware';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentAuditLog } from '../../../src/api/models/ExperimentAuditLog';
import { ExperimentSegmentInclusion } from '../../../src/api/models/ExperimentSegmentInclusion';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { MoocletExperimentRef } from '../../../src/api/models/MoocletExperimentRef';
import { Segment } from '../../../src/api/models/Segment';
import { User } from '../../../src/api/models/User';
import { CacheService } from '../../../src/api/services/CacheService';
import { ExperimentPrecomputedSegmentService } from '../../../src/api/services/ExperimentPrecomputedSegmentService';
import { FeatureFlagPrecomputedSegmentService } from '../../../src/api/services/FeatureFlagPrecomputedSegmentService';
import { MoocletExperimentService } from '../../../src/api/services/MoocletExperimentService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { BatchDeleteService } from '../../../src/api/services/batch/BatchDeleteService';
import { currentUserChecker } from '../../../src/auth/currentUserChecker';
import { env } from '../../../src/env';
import { iocLoader } from '../../../src/loaders/iocLoader';

const entities: BatchDeleteEntity[] = ['experiments', 'flags', 'segments'];
const model = { experiments: Experiment, flags: FeatureFlag, segments: Segment };
const route = (entity: BatchDeleteEntity) => `/api/${entity}/batch-delete`;

export function registerBatchDeleteTests(connections: () => [DataSource, DataSource]) {
  describe('Batch deletion', () => {
    let db: DataSource;
    let writer: DataSource;
    let app: Application;
    let originalAuth: boolean;
    let originalMooclet: boolean;
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
      originalMooclet = env.mooclets.enabled;
      env.google.authTokenRequired = false;
      env.mooclets.enabled = false;
    });
    afterEach(() => {
      env.google.authTokenRequired = originalAuth;
      env.mooclets.enabled = originalMooclet;
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

    test.each(entities)('%s validates IDs and authentication before dispatch', async (entity) => {
      const spy = jest.spyOn(Container.get(BatchDeleteService), 'delete');
      const id = randomUUID();
      for (const body of [{}, { ids: [] }, { ids: ['bad-id'] }, { ids: [id, id.toUpperCase()] }]) {
        await request(app).post(route(entity)).send(body).expect(400);
      }
      env.google.authTokenRequired = true;
      await request(app)
        .post(route(entity))
        .send({ ids: [id] })
        .expect(401);
      env.google.authTokenRequired = false;
      await db.getRepository(User).delete({ email: SYSTEM_USER_EMAIL });
      await request(app)
        .post(route(entity))
        .send({ ids: [id] })
        .expect(401);
      expect(spy).not.toHaveBeenCalled();
    });

    test.each(Object.values(UserRole))('enforces server-side %s permissions despite body overrides', async (role) => {
      await db.getRepository(User).update(SYSTEM_USER_EMAIL, { role });
      for (const entity of entities) {
        const [row] = await create(entity);
        const allowed =
          role === UserRole.ADMIN ||
          role === UserRole.CREATOR ||
          (role === UserRole.USER_MANAGER && entity === 'segments');
        const { body } = await request(app)
          .post(route(entity))
          .send({
            ids: [row.id],
            role: UserRole.ADMIN,
            canDelete: true,
          })
          .expect(allowed ? 200 : 403);
        if (allowed) expect(body.results).toEqual([{ id: row.id, outcome: 'deleted' }]);
        expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(allowed ? 0 : 1);
      }
    });

    test.each(entities)('%s deletes owned lists and members while preserving public children', async (entity) => {
      const rows = await create(entity, 2);
      const [child] = await create('segments');
      const lists = await Promise.all(rows.map((row) => ownedList(entity, row.id, child.id)));
      const ids = rows.map((row) => row.id.toUpperCase()).reverse();
      const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
      expect(body).toEqual({ phase: 'executed', results: ids.map((id) => ({ id, outcome: 'deleted' })) });
      expect(await db.getRepository(model[entity]).countBy({ id: In(ids) })).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: In(lists.map((list) => list.id)) })).toBe(0);
      expect(
        await db.getRepository(IndividualForSegment).countBy({ segmentId: In(lists.map((list) => list.id)) })
      ).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
    });

    test.each(entities)('%s skips a missing ID and deletes the remaining selection', async (entity) => {
      const [row] = await create(entity);
      const missing = randomUUID();
      const { body } = await request(app)
        .post(route(entity))
        .send({ ids: [row.id, missing] })
        .expect(200);
      expect(body).toEqual({
        phase: 'executed',
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
          phase: 'executed',
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
      } finally {
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_audit ON experiment_audit_log');
        await db.query('DROP FUNCTION IF EXISTS batch_test_reject_audit()');
      }
    });

    test('bounds a target lock wait and reports a confirmed failure without deleting', async () => {
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
            // A tighter deployment default must survive the batch's five-second cap.
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
      const flags = jest.spyOn(Container.get(FeatureFlagPrecomputedSegmentService), 'withRecompute');
      const experiments = jest.spyOn(
        Container.get(ExperimentPrecomputedSegmentService),
        'scheduleRecomputeForExperiments'
      );
      const { body } = await request(app)
        .post(route('segments'))
        .send({ ids: rows.map((row) => row.id) })
        .expect(200);
      expect(body.results).toEqual([
        { id: rows[0].id, outcome: 'deleted', reasonCode: DeletionReasonCode.POST_DELETE_FAILED },
        { id: rows[1].id, outcome: 'not_attempted' },
      ]);
      expect(observedCount).toBe(0);
      expect(flags).toHaveBeenCalledTimes(1);
      expect(experiments).toHaveBeenCalledTimes(1);
      expect(await db.getRepository(Segment).countBy({ id: rows[1].id })).toBe(1);
    });

    test.each([true, false])(
      'preserves Mooclet orchestration and local commit/rollback when remote deletion returns %s',
      async (success) => {
        env.mooclets.enabled = true;
        const [row] = await create('experiments');
        await db.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
        const list = await ownedList('experiments', row.id);
        const service = Container.get(MoocletExperimentService);
        const ref = { id: randomUUID() } as MoocletExperimentRef;
        jest.spyOn(service, 'getMoocletExperimentRefByUpgradeExperimentId').mockResolvedValue(ref);
        // Only the network boundary is stubbed; syncDelete and its nested local transaction run normally.
        const remote = jest.spyOn(service, 'orchestrateDeleteMoocletResources').mockResolvedValue(success);
        const { body } = await request(app)
          .post(route('experiments'))
          .send({ ids: [row.id] })
          .expect(200);
        expect(body.results).toEqual([
          success
            ? { id: row.id, outcome: 'deleted' }
            : {
                id: row.id,
                outcome: 'failed',
                reasonCode: DeletionReasonCode.EXTERNAL_SYNC_FAILED,
              },
        ]);
        expect(remote).toHaveBeenCalledWith(ref, expect.anything());
        expect(await db.getRepository(Experiment).countBy({ id: row.id })).toBe(success ? 0 : 1);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(success ? 0 : 1);
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(
          success ? 1 : 0
        );
      }
    );

    test.each(entities)(
      '%s single-delete route keeps its existing roles, cleanup and success response',
      async (entity) => {
        await db.getRepository(User).update(SYSTEM_USER_EMAIL, { role: UserRole.READER });
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
      }
    );

    test.each(['single', 'batch'])('experiment %s deletion allows every experiment state', async (mode) => {
      const states = [
        ...new Set(
          Object.values(EXPERIMENT_STATE).map((state) => EXPERIMENT_STATE_INTERNAL_NAME_OVERRIDES[state] || state)
        ),
      ];
      const rows = await create('experiments', states.length);
      for (const [index, row] of rows.entries()) {
        await db.getRepository(Experiment).update(row.id, { state: states[index] });
      }
      if (mode === 'single') {
        for (const row of rows) await request(app).delete(`/api/experiments/${row.id}`).expect(200);
      } else {
        const { body } = await request(app)
          .post(route('experiments'))
          .send({ ids: rows.map(({ id }) => id) })
          .expect(200);
        expect(body.results).toEqual(rows.map(({ id }) => ({ id, outcome: 'deleted' })));
      }
      expect(await db.getRepository(Experiment).countBy({ id: In(rows.map(({ id }) => id)) })).toBe(0);
      expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(
        rows.length
      );
    });

    test.each(['single', 'batch'])('%s deletion allows Enabled flags and Used segments', async (mode) => {
      for (const entity of ['flags', 'segments'] as const) {
        const [row] = await create(entity);
        const list = await ownedList(entity, row.id);
        let ownerId: string;
        if (entity === 'flags') {
          await db.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
        } else {
          const [owner] = await create('flags');
          ownerId = owner.id;
          await ownedList('flags', owner.id, row.id);
        }
        if (mode === 'single') {
          await request(app).delete(`/api/${entity}/${row.id}`).expect(200);
        } else {
          const { body } = await request(app)
            .post(route(entity))
            .send({ ids: [row.id] })
            .expect(200);
          expect(body.results).toEqual([{ id: row.id, outcome: 'deleted' }]);
        }
        expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(0);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(0);
        expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(0);
        if (ownerId) expect(await db.getRepository(FeatureFlag).countBy({ id: ownerId })).toBe(1);
      }
    });

    test.each(entities)('%s single-delete preserves its original missing-target response', async (entity) => {
      const { body } = await request(app)
        .delete(`/api/${entity}/${randomUUID()}`)
        .expect(entity === 'segments' ? 500 : 404);
      if (entity === 'experiments') expect(body.message).toBe('Experiment not found.');
    });

    test.each(['single', 'batch'])('%s deletion allows private and global-exclude segments', async (mode) => {
      for (const type of [SEGMENT_TYPE.PRIVATE, SEGMENT_TYPE.GLOBAL_EXCLUDE]) {
        const [row] = await create('segments');
        await db.getRepository(Segment).update(row.id, { type });
        if (mode === 'single') {
          await request(app).delete(`/api/segments/${row.id}`).expect(200);
        } else {
          const { body } = await request(app)
            .post(route('segments'))
            .send({ ids: [row.id] })
            .expect(200);
          expect(body.results).toEqual([{ id: row.id, outcome: 'deleted' }]);
        }
        expect(await db.getRepository(Segment).countBy({ id: row.id })).toBe(0);
      }
    });

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

    test.each([true, false])(
      'single Mooclet deletion preserves commit/rollback when remote deletion returns %s',
      async (success) => {
        env.mooclets.enabled = true;
        const [row] = await create('experiments');
        await db.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
        const list = await ownedList('experiments', row.id);
        const service = Container.get(MoocletExperimentService);
        jest
          .spyOn(service, 'getMoocletExperimentRefByUpgradeExperimentId')
          .mockResolvedValue({ id: randomUUID() } as MoocletExperimentRef);
        const remote = jest.spyOn(service, 'orchestrateDeleteMoocletResources').mockResolvedValue(success);
        const { body } = await request(app)
          .delete(`/api/experiments/${row.id}`)
          .expect(success ? 200 : 500);
        if (success) expect(body).toEqual([expect.objectContaining({ id: row.id })]);
        expect(remote).toHaveBeenCalledTimes(1);
        expect(await db.getRepository(Experiment).countBy({ id: row.id })).toBe(success ? 0 : 1);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(success ? 0 : 1);
        expect(await db.getRepository(ExperimentAuditLog).countBy({ type: LOG_TYPE.EXPERIMENT_DELETED })).toBe(
          success ? 1 : 0
        );
      }
    );

    test.each(entities.flatMap((entity) => [20, 100, 500].map((count) => ({ entity, count }))))(
      '$entity deletes $count selections without global eligibility reads',
      async ({ entity, count }) => {
        const rows = await create(entity, count);
        const ids = rows.map((row) => row.id).reverse();
        const status = jest.spyOn(Container.get(SegmentService), 'getSegmentStatus');
        const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
        expect(body).toEqual({ phase: 'executed', results: ids.map((id) => ({ id, outcome: 'deleted' })) });
        expect(status).not.toHaveBeenCalled();
        expect(await db.getRepository(model[entity]).countBy({ id: In(ids) })).toBe(0);
      }
    );
  });
}
