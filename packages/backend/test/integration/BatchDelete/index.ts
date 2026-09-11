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
  FEATURE_FLAG_STATUS,
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
import { DeletionEligibilityService } from '../../../src/api/services/batch/DeletionEligibilityService';
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

    test('skips a hidden Used segment and deletes an eligible selection', async () => {
      const [unused, child, parent] = await create('segments', 3);
      await ownedList('segments', parent.id, child.id);
      const [experiment] = await create('experiments');
      await ownedList('experiments', experiment.id, parent.id);
      const { body } = await request(app)
        .post(route('segments'))
        .send({
          ids: [unused.id, child.id],
          searchParams: { key: 'name', string: unused.name },
        })
        .expect(200);
      expect(body.phase).toBe('executed');
      expect(body.results).toEqual([
        { id: unused.id, outcome: 'deleted' },
        { id: child.id, outcome: 'ineligible', reasonCode: DeletionReasonCode.SEGMENT_IN_USE },
      ]);
      expect(await db.getRepository(Segment).countBy({ id: unused.id })).toBe(0);
      expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
    });

    test.each(entities)('%s rechecks eligibility after preflight using the mutation transaction', async (entity) => {
      const [before, row, after] = await create(entity, 3);
      const service = Container.get(DeletionEligibilityService);
      const original = service[entity].bind(service);
      jest.spyOn(service, entity).mockImplementationOnce(async (ids, user) => {
        const result = await original(ids, user);
        // A separate connection commits a normal edit after the bulk read, before deletion begins.
        if (entity === 'experiments')
          await writer.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
        else if (entity === 'flags')
          await writer.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
        else {
          const [flag] = await create('flags');
          await ownedList('flags', flag.id, row.id, writer);
        }
        return result;
      });
      const { body } = await request(app)
        .post(route(entity))
        .send({ ids: [before.id, row.id, after.id] })
        .expect(200);
      expect(body).toEqual({
        phase: 'executed',
        results: [
          { id: before.id, outcome: 'deleted' },
          {
            id: row.id,
            outcome: 'ineligible',
            reasonCode:
              entity === 'experiments'
                ? DeletionReasonCode.EXPERIMENT_STATE_UNSUPPORTED
                : entity === 'flags'
                ? DeletionReasonCode.FEATURE_FLAG_ENABLED
                : DeletionReasonCode.SEGMENT_IN_USE,
          },
          { id: after.id, outcome: 'deleted' },
        ],
      });
      expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(1);
      expect(await db.getRepository(model[entity]).countBy({ id: In([before.id, after.id]) })).toBe(0);
    });

    test.each(entities.flatMap((entity) => [0, 1, 2].map((blockedIndex) => ({ entity, blockedIndex }))))(
      '$entity skips an ineligible selection at position $blockedIndex and deletes the other two',
      async ({ entity, blockedIndex }) => {
        const rows = await create(entity, 3);
        const blocked = rows[blockedIndex];
        const lists = [];
        for (const row of rows) lists.push(await ownedList(entity, row.id));
        if (entity === 'experiments')
          await writer.getRepository(Experiment).update(blocked.id, { state: EXPERIMENT_STATE.DRAFT });
        else if (entity === 'flags')
          await writer.getRepository(FeatureFlag).update(blocked.id, { status: FEATURE_FLAG_STATUS.ENABLED });
        else {
          const [flag] = await create('flags');
          await ownedList('flags', flag.id, blocked.id, writer);
        }
        const { body } = await request(app)
          .post(route(entity))
          .send({ ids: rows.map((row) => row.id) })
          .expect(200);
        expect(body.phase).toBe('executed');
        expect(body.results.map((item) => ({ id: item.id, outcome: item.outcome }))).toEqual(
          rows.map((row, index) => ({ id: row.id, outcome: index === blockedIndex ? 'ineligible' : 'deleted' }))
        );
        for (const [index, row] of rows.entries()) {
          const remaining = index === blockedIndex ? 1 : 0;
          expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(remaining);
          expect(await db.getRepository(Segment).countBy({ id: lists[index].id })).toBe(remaining);
          expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: lists[index].id })).toBe(remaining);
        }
      }
    );

    test('reports an owned-list cleanup rollback after a committed success and stops the remaining items', async () => {
      const rows = await create('flags', 3);
      const list = await ownedList('flags', rows[1].id);
      try {
        await db.query(`CREATE OR REPLACE FUNCTION batch_test_reject_delete() RETURNS trigger AS $$
          BEGIN IF OLD.id = TG_ARGV[0]::uuid THEN RAISE EXCEPTION 'batch cleanup failure'; END IF;
          RETURN OLD; END; $$ LANGUAGE plpgsql`);
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_delete ON segment');
        // The interpolated UUID is generated only by this fixture.
        await db.query(`CREATE TRIGGER batch_test_reject_delete BEFORE DELETE ON segment
          FOR EACH ROW EXECUTE FUNCTION batch_test_reject_delete('${list.id}')`);
        const { body } = await request(app)
          .post(route('flags'))
          .send({ ids: rows.map((row) => row.id) })
          .expect(200);
        expect(body).toEqual({
          phase: 'executed',
          results: [
            { id: rows[0].id, outcome: 'deleted' },
            { id: rows[1].id, outcome: 'failed', reasonCode: DeletionReasonCode.DELETE_FAILED },
            { id: rows[2].id, outcome: 'not_attempted' },
          ],
        });
        expect(await db.getRepository(FeatureFlag).countBy({ id: rows[0].id })).toBe(0);
        expect(await db.getRepository(FeatureFlag).countBy({ id: In(rows.slice(1).map((row) => row.id)) })).toBe(2);
        expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(1);
        expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(1);
        expect(await db.getRepository(FeatureFlagSegmentInclusion).countBy({ segmentId: list.id })).toBe(1);
      } finally {
        await db.query('DROP TRIGGER IF EXISTS batch_test_reject_delete ON segment');
        await db.query('DROP FUNCTION IF EXISTS batch_test_reject_delete()');
      }
    });

    test('bounds a guard lock wait and reports a confirmed failure without deleting', async () => {
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

    test.each(entities)('%s single-delete rejects an ineligible target before removing owned lists', async (entity) => {
      const [row] = await create(entity);
      const list = await ownedList(entity, row.id);
      if (entity === 'experiments')
        await db.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
      else if (entity === 'flags')
        await db.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
      else {
        const [flag] = await create('flags');
        await ownedList('flags', flag.id, row.id);
      }
      const messages = {
        experiments: 'The experiment cannot be deleted in its current state.',
        flags: 'Disable the feature flag before deleting it.',
        segments: 'The segment is in use and cannot be deleted.',
      };
      const { body } = await request(app).delete(`/api/${entity}/${row.id}`).expect(400);
      expect(body.message).toBe(messages[entity]);
      expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(1);
      expect(await db.getRepository(Segment).countBy({ id: list.id })).toBe(1);
      expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: list.id })).toBe(1);
    });

    test.each(entities)('%s single-delete reports a missing target as 404', async (entity) => {
      const { body } = await request(app).delete(`/api/${entity}/${randomUUID()}`).expect(404);
      expect(body.message).toBe('The item no longer exists.');
    });

    test.each(['experiments', 'flags'] as const)(
      '%s single-delete waits for a concurrent state edit and rejects its committed state',
      async (entity) => {
        const [row] = await create(entity);
        const blocker = writer.createQueryRunner();
        await blocker.connect();
        await blocker.startTransaction();
        let pending: Promise<request.Response>;
        try {
          if (entity === 'experiments')
            await blocker.manager.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
          else await blocker.manager.getRepository(FeatureFlag).update(row.id, { status: FEATURE_FLAG_STATUS.ENABLED });
          const [{ pid: writerPid }] = await blocker.query('SELECT pg_backend_pid() AS pid');
          let started: (pid: number) => void;
          const transactionStarted = new Promise<number>((resolve) => {
            started = resolve;
          });
          const original = db.createQueryRunner.bind(db);
          jest.spyOn(db, 'createQueryRunner').mockImplementation((...args) => {
            const runner = original(...args);
            const start = runner.startTransaction.bind(runner);
            jest.spyOn(runner, 'startTransaction').mockImplementation(async (...startArgs) => {
              await start(...startArgs);
              const [{ pid }] = await runner.query('SELECT pg_backend_pid() AS pid');
              started(pid);
            });
            return runner;
          });
          pending = request(app)
            .delete(`/api/${entity}/${row.id}`)
            .then((response) => response);
          const deletionPid = await Promise.race([
            transactionStarted,
            pending.then(() => {
              throw new Error('Deletion finished before starting its transaction');
            }),
          ]);
          let waiting = false;
          const deadline = Date.now() + 4000;
          while (!waiting && Date.now() < deadline) {
            [{ waiting }] = await blocker.query('SELECT $2::integer = ANY(pg_blocking_pids($1::integer)) AS waiting', [
              deletionPid,
              writerPid,
            ]);
            if (!waiting) await new Promise<void>((resolve) => setImmediate(resolve));
          }
          expect(waiting).toBe(true);
          await blocker.commitTransaction();
          expect((await pending).status).toBe(400);
          expect(await db.getRepository(model[entity]).countBy({ id: row.id })).toBe(1);
        } finally {
          if (blocker.isTransactionActive) await blocker.rollbackTransaction();
          await pending;
          await blocker.release();
        }
      },
      10000
    );

    test.each([SEGMENT_TYPE.PRIVATE, SEGMENT_TYPE.GLOBAL_EXCLUDE])(
      'single-delete rejects a %s segment through the ordinary root endpoint',
      async (type) => {
        const [row] = await create('segments');
        await db.getRepository(Segment).update(row.id, { type });
        await request(app).delete(`/api/segments/${row.id}`).expect(400);
        expect(await db.getRepository(Segment).countBy({ id: row.id })).toBe(1);
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

    test('single Mooclet deletion rejects an ineligible experiment before local or remote deletion', async () => {
      env.mooclets.enabled = true;
      const [row] = await create('experiments');
      await db.getRepository(Experiment).update(row.id, { state: EXPERIMENT_STATE.DRAFT });
      const service = Container.get(MoocletExperimentService);
      jest
        .spyOn(service, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue({ id: randomUUID() } as MoocletExperimentRef);
      const remote = jest.spyOn(service, 'orchestrateDeleteMoocletResources').mockResolvedValue(true);
      await request(app).delete(`/api/experiments/${row.id}`).expect(400);
      expect(remote).not.toHaveBeenCalled();
      expect(await db.getRepository(Experiment).countBy({ id: row.id })).toBe(1);
    });

    test.each([true, false])(
      'single Mooclet deletion preserves commit/rollback when remote deletion returns %s',
      async (success) => {
        env.mooclets.enabled = true;
        const [row] = await create('experiments');
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
      }
    );

    test.each(entities.flatMap((entity) => [20, 100, 500].map((count) => ({ entity, count }))))(
      '$entity deletes $count selections without repeating global eligibility reads per item',
      async ({ entity, count }) => {
        const rows = await create(entity, count);
        const ids = rows.map((row) => row.id).reverse();
        const status = jest.spyOn(Container.get(SegmentService), 'getSegmentStatus');
        const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
        expect(body).toEqual({ phase: 'executed', results: ids.map((id) => ({ id, outcome: 'deleted' })) });
        expect(status).toHaveBeenCalledTimes(entity === 'segments' ? 1 : 0);
        expect(await db.getRepository(model[entity]).countBy({ id: In(ids) })).toBe(0);
      }
    );
  });
}
