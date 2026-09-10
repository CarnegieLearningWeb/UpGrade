import { randomUUID } from 'crypto';
import { Application } from 'express';
import request from 'supertest';
import Container from 'typedi';
import { createExpressServer } from 'routing-controllers';
import { DataSource } from 'typeorm';
import {
  ASSIGNMENT_UNIT,
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
import { FeatureFlagSegmentExclusion } from '../../../src/api/models/FeatureFlagSegmentExclusion';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { Segment } from '../../../src/api/models/Segment';
import { User } from '../../../src/api/models/User';
import { DeletionEligibilityService } from '../../../src/api/services/batch/DeletionEligibilityService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { currentUserChecker } from '../../../src/auth/currentUserChecker';
import { env } from '../../../src/env';
import { iocLoader } from '../../../src/loaders/iocLoader';

const entities = ['experiments', 'flags', 'segments'] as const;
type Entity = (typeof entities)[number];
const route = (entity: Entity) => `/api/${entity}/deletion-eligibility`;

export function registerDeletionEligibilityTests(connections: () => [DataSource, DataSource]) {
  describe('Deletion eligibility', () => {
    let db: DataSource;
    let app: Application;
    let originalAuth: boolean;
    beforeAll(() => {
      iocLoader();
      // The global unit-test setup mocks auth. These HTTP tests use the real checker and seeded users.
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
      [db] = connections();
      originalAuth = env.google.authTokenRequired;
      env.google.authTokenRequired = false;
    });
    afterEach(() => {
      env.google.authTokenRequired = originalAuth;
      jest.restoreAllMocks();
    });

    const create = async (entity: Entity, count = 1) => {
      const rows = Array.from({ length: count }, (_, index) => ({
        id: randomUUID(),
        name: `Eligibility ${index}`,
        context: 'home',
      }));
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
      } else {
        await db.getRepository(Segment).insert(rows.map((row) => ({ ...row, type: SEGMENT_TYPE.PUBLIC })));
      }
      return rows;
    };
    const list = async (name: string, child: { id: string }) => {
      const row = {
        id: randomUUID(),
        name,
        context: 'home',
        type: SEGMENT_TYPE.PRIVATE,
        listType: STANDARD_LIST_TYPE.SEGMENT,
      };
      await db.getRepository(Segment).insert(row);
      // Match the existing Add List service's relation write; avoid cascading saves of partial children.
      await db.createQueryBuilder().relation(Segment, 'subSegments').of(row.id).add(child.id);
      return row;
    };

    test.each(entities)('%s rejects invalid IDs before the eligibility service runs', async (entity) => {
      const service = Container.get(DeletionEligibilityService);
      const spy = jest.spyOn(service, entity);
      const id = randomUUID();
      const invalid = [
        {},
        { ids: [] },
        { ids: null },
        { ids: id },
        { ids: [42] },
        { ids: ['bad-id'] },
        { ids: [id, 'bad-id'] },
        { ids: [id, id] },
        { ids: [id, id.toUpperCase()] },
      ];
      for (const body of invalid) await request(app).post(route(entity)).send(body).expect(400);
      expect(spy).not.toHaveBeenCalled();
    });

    test.each(entities)('%s rejects unauthenticated requests and a missing current user', async (entity) => {
      const spy = jest.spyOn(Container.get(DeletionEligibilityService), entity);
      env.google.authTokenRequired = true;
      await request(app)
        .post(route(entity))
        .send({ ids: [randomUUID()] })
        .expect(401);
      env.google.authTokenRequired = false;
      await db.getRepository(User).delete({ email: SYSTEM_USER_EMAIL });
      await request(app)
        .post(route(entity))
        .send({ ids: [randomUUID()] })
        .expect(401);
      expect(spy).not.toHaveBeenCalled();
    });

    test.each(Object.values(UserRole))('uses server permissions for %s', async (role) => {
      await db.getRepository(User).update(SYSTEM_USER_EMAIL, { role });
      for (const entity of entities) {
        const [row] = await create(entity);
        const { body } = await request(app)
          .post(route(entity))
          .send({
            ids: [row.id],
            role: UserRole.ADMIN,
            canDelete: true,
            stateOrStatus: 'unused',
          })
          .expect(200);
        const allowed =
          role === UserRole.ADMIN ||
          role === UserRole.CREATOR ||
          (role === UserRole.USER_MANAGER && entity === 'segments');
        expect(body.allDeletable).toBe(allowed);
        expect(body.items[0]).toMatchObject({
          id: row.id,
          name: row.name,
          availability: 'present',
          canDelete: allowed,
        });
        expect(body.items[0].reasonCode).toBe(allowed ? undefined : DeletionReasonCode.MISSING_PERMISSION);
      }
    });

    test('normalizes experiment aliases and matches all existing menu states', async () => {
      const states: [EXPERIMENT_STATE, string, boolean][] = [
        [EXPERIMENT_STATE.INACTIVE, 'inactive', true],
        [EXPERIMENT_STATE.ENROLLING, 'running', true],
        [EXPERIMENT_STATE.ENROLLMENT_COMPLETE, 'paused', true],
        [EXPERIMENT_STATE.CANCELLED, 'completed', true],
        [EXPERIMENT_STATE.ARCHIVED, 'archived', true],
        [EXPERIMENT_STATE.DRAFT, 'draft', false],
        [EXPERIMENT_STATE.PREVIEW, 'preview', false],
        [EXPERIMENT_STATE.SCHEDULED, 'scheduled', false],
      ];
      const rows = await create('experiments', states.length);
      for (let i = 0; i < rows.length; i++)
        await db.getRepository(Experiment).update(rows[i].id, { state: states[i][0] });
      const { body } = await request(app)
        .post(route('experiments'))
        .send({ ids: rows.map((row) => row.id) })
        .expect(200);
      expect(body.allDeletable).toBe(false);
      body.items.forEach((item, i) => {
        expect(item.stateOrStatus).toBe(states[i][1]);
        expect(item.canDelete).toBe(states[i][2]);
        expect(item.reasonCode).toBe(states[i][2] ? undefined : DeletionReasonCode.EXPERIMENT_STATE_UNSUPPORTED);
      });
    });

    test('allows disabled/archived flags and observes a later enablement', async () => {
      const rows = await create('flags', 3);
      await db.getRepository(FeatureFlag).update(rows[1].id, { status: FEATURE_FLAG_STATUS.ARCHIVED });
      await db.getRepository(FeatureFlag).update(rows[2].id, { status: FEATURE_FLAG_STATUS.ENABLED });
      const ids = rows.map((row) => row.id);
      const first = await request(app).post(route('flags')).send({ ids }).expect(200);
      expect(first.body.items.map((item) => item.canDelete)).toEqual([true, true, false]);
      expect(first.body.items[2].reasonCode).toBe(DeletionReasonCode.FEATURE_FLAG_ENABLED);
      await db.getRepository(FeatureFlag).update(rows[0].id, { status: FEATURE_FLAG_STATUS.ENABLED });
      const second = await request(app)
        .post(route('flags'))
        .send({ ids: [ids[0]] })
        .expect(200);
      expect(second.body.allDeletable).toBe(false);
      expect(second.body.items[0].reasonCode).toBe(DeletionReasonCode.FEATURE_FLAG_ENABLED);
    });

    test.each(entities)('%s preserves input order and reports missing IDs without exposing details', async (entity) => {
      const rows = await create(entity, 2);
      const ids = [rows[1].id.toUpperCase(), randomUUID(), rows[0].id];
      const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
      expect(body.items.map((item) => item.id)).toEqual(ids);
      expect(body.items.map((item) => item.canDelete)).toEqual([true, false, true]);
      expect(body.items[1]).toEqual({
        id: ids[1],
        availability: 'not_found',
        canDelete: false,
        reasonCode: 'not_found',
      });
      for (const item of body.items) {
        expect(
          Object.keys(item).every((key) =>
            ['id', 'availability', 'name', 'stateOrStatus', 'segmentType', 'canDelete', 'reasonCode'].includes(key)
          )
        ).toBe(true);
      }
      expect(body.allDeletable).toBe(false);
    });

    test('includes hidden Used selections using the current UI private-list structure', async () => {
      const [unused, child, parent] = await create('segments', 3);
      // Same topology as Add List: public parent -> private Segment list -> public child.
      const childList = await list('Child list', child);
      await db.createQueryBuilder().relation(Segment, 'subSegments').of(parent.id).add(childList.id);
      const ownerList = await list('Experiment list', parent);
      const [experiment] = await create('experiments');
      await db
        .getRepository(ExperimentSegmentInclusion)
        .insert({ experimentId: experiment.id, segmentId: ownerList.id });
      await db.getRepository(IndividualForSegment).insert({ segmentId: unused.id, userId: 'do-not-return-members' });
      const spy = jest.spyOn(Container.get(SegmentService), 'getSegmentStatus');
      const { body } = await request(app)
        .post(route('segments'))
        .send({
          ids: [unused.id, child.id],
          searchParams: { key: 'name', string: unused.name },
        })
        .expect(200);
      expect(body.items.map((item) => item.canDelete)).toEqual([true, false]);
      expect(body.items[1].reasonCode).toBe(DeletionReasonCode.SEGMENT_IN_USE);
      expect(body.allDeletable).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].map((row) => row.id).sort()).toEqual([unused.id, child.id].sort());
      expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: unused.id })).toBe(1);
    });

    test('preserves archived-experiment and disabled-flag reference rules', async () => {
      const [archivedChild, flagChild] = await create('segments', 2);
      const [experiment] = await create('experiments');
      await db.getRepository(Experiment).update(experiment.id, { state: EXPERIMENT_STATE.ARCHIVED });
      const experimentList = await list('Archived owner list', archivedChild);
      await db
        .getRepository(ExperimentSegmentInclusion)
        .insert({ experimentId: experiment.id, segmentId: experimentList.id });
      const [flag] = await create('flags');
      const flagList = await list('Disabled flag list', flagChild);
      await db.getRepository(FeatureFlagSegmentExclusion).insert({
        featureFlagId: flag.id,
        segmentId: flagList.id,
        enabled: false,
        listType: STANDARD_LIST_TYPE.SEGMENT,
      });
      const { body } = await request(app)
        .post(route('segments'))
        .send({ ids: [archivedChild.id, flagChild.id] })
        .expect(200);
      expect(body.items.map((item) => item.canDelete)).toEqual([true, false]);
      expect(body.items[1].reasonCode).toBe(DeletionReasonCode.SEGMENT_IN_USE);
    });

    test('rejects global/private segments and omits private-list metadata', async () => {
      const rows = await create('segments', 2);
      await db.getRepository(Segment).update(rows[0].id, { type: SEGMENT_TYPE.PRIVATE });
      await db.getRepository(Segment).update(rows[1].id, { type: SEGMENT_TYPE.GLOBAL_EXCLUDE });
      const spy = jest.spyOn(Container.get(SegmentService), 'getSegmentStatus');
      const { body } = await request(app)
        .post(route('segments'))
        .send({ ids: rows.map((row) => row.id) })
        .expect(200);
      expect(body.items[0]).toEqual({
        id: rows[0].id,
        availability: 'unavailable',
        canDelete: false,
        reasonCode: DeletionReasonCode.PROTECTED_SEGMENT_TYPE,
      });
      expect(body.items[1]).toMatchObject({
        stateOrStatus: 'excluded',
        canDelete: false,
        reasonCode: DeletionReasonCode.PROTECTED_SEGMENT_TYPE,
      });
      expect(body.allDeletable).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    test.each(entities.flatMap((entity) => [20, 100, 500].map((count) => ({ entity, count }))))(
      '$entity accepts $count IDs in one read-only HTTP request with fixed query count',
      async ({ entity, count }) => {
        const rows = await create(entity, count);
        const ids = rows.map((row) => row.id).reverse();
        const querySpy = jest.spyOn(db.logger, 'logQuery');
        const service = Container.get(SegmentService);
        const statusSpy = jest.spyOn(service, 'getSegmentStatus');
        const detailsSpy = jest.spyOn(service, 'getSingleSegmentWithStatus');
        const membersSpy = jest.spyOn(service, 'getSegmentByIds');
        const { body } = await request(app).post(route(entity)).send({ ids }).expect(200);
        expect(body.allDeletable).toBe(true);
        expect(body.items.map((item) => item.id)).toEqual(ids);
        const queries = querySpy.mock.calls.map(([sql]) => sql);
        expect(queries.filter((sql) => /^(INSERT|UPDATE|DELETE|ALTER|CREATE)|FOR (UPDATE|SHARE)/i.test(sql))).toEqual(
          []
        );
        // Includes the real auth check's user lookup and, for segments, BEGIN/COMMIT plus the five shared reads.
        expect(queries).toHaveLength(entity === 'segments' ? 9 : 2);
        expect(statusSpy).toHaveBeenCalledTimes(entity === 'segments' ? 1 : 0);
        expect(detailsSpy).not.toHaveBeenCalled();
        expect(membersSpy).not.toHaveBeenCalled();
      }
    );
  });
}
