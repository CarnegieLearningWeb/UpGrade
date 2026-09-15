import { randomUUID } from 'crypto';
import Container from 'typedi';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import {
  ASSIGNMENT_UNIT,
  EXPERIMENT_STATE,
  POST_EXPERIMENT_RULE,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  STANDARD_LIST_TYPE,
} from 'upgrade_types';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentSegmentInclusion } from '../../../src/api/models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../../../src/api/models/ExperimentSegmentExclusion';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../../../src/api/models/FeatureFlagSegmentExclusion';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { Segment } from '../../../src/api/models/Segment';
import { SegmentService, SegmentWithStatus } from '../../../src/api/services/SegmentService';
import { assertSegmentDeletionAllowed as assertAllowed } from '../../../src/api/services/batch/SegmentDeletionGuard';
import { DeletionRepository } from '../../../src/api/repositories/DeletionRepository';
import { Container as repositoryContainer } from '../../../src/typeorm-typedi-extensions';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

const changes = [
  'experiment inclusion',
  'experiment exclusion',
  'flag inclusion',
  'flag exclusion',
  'nested experiment inclusion',
  'nested experiment exclusion',
  'nested flag inclusion',
  'nested flag exclusion',
  'nested parent',
  'archived owner state',
  'parent list type',
] as const;
type Change = (typeof changes)[number];

const barrier = () => {
  let release: () => void;
  const reached = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { reached, release };
};
const outcome = <T>(work: Promise<T>): Promise<{ value?: T; error?: any }> =>
  work.then(
    (value) => ({ value }),
    (error) => ({ error })
  );

const waitForBarrier = (signal: ReturnType<typeof barrier>, work: ReturnType<typeof outcome>) =>
  Promise.race([
    signal.reached,
    work.then((result) => {
      throw result.error || new Error('Deletion completed before the test barrier');
    }),
  ]);

const createSegment = async (db: DataSource, type = SEGMENT_TYPE.PUBLIC, children: Segment[] = []) => {
  const repo = db.getRepository(Segment);
  return repo.save(
    repo.create({
      id: randomUUID(),
      name: 'Guard fixture',
      context: 'guard-test',
      type,
      listType: children.length ? STANDARD_LIST_TYPE.SEGMENT : STANDARD_LIST_TYPE.INDIVIDUAL,
      subSegments: children,
    })
  );
};

const createChange = async (db: DataSource, change: Change) => {
  const target = await createSegment(db);
  await db.getRepository(IndividualForSegment).insert({ segmentId: target.id, userId: 'retained-on-rejection' });
  const nested = change.startsWith('nested') || change === 'archived owner state' || change === 'parent list type';
  const referenced = nested ? await createSegment(db, SEGMENT_TYPE.PRIVATE, [target]) : target;
  let apply: (manager: EntityManager) => Promise<unknown>;

  if (change.includes('experiment') || change === 'archived owner state') {
    const repo = db.getRepository(Experiment);
    const experiment = await repo.save(
      repo.create({
        id: randomUUID(),
        name: 'Guard owner',
        description: '',
        context: ['guard-test'],
        state: change === 'archived owner state' ? EXPERIMENT_STATE.ARCHIVED : EXPERIMENT_STATE.INACTIVE,
        assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
        postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
      })
    );
    const entity = change.includes('exclusion') ? ExperimentSegmentExclusion : ExperimentSegmentInclusion;
    const ref = { experimentId: experiment.id, segmentId: referenced.id };
    apply = (manager) => manager.getRepository(entity).insert(ref);
    if (change === 'archived owner state') {
      await apply(db.manager);
      apply = (manager) =>
        manager.getRepository(Experiment).update(experiment.id, { state: EXPERIMENT_STATE.INACTIVE });
    }
  } else if (change.includes('flag')) {
    const repo = db.getRepository(FeatureFlag);
    const flag = await repo.save(
      repo.create({
        id: randomUUID(),
        name: 'Guard owner',
        key: randomUUID(),
        description: '',
        context: ['guard-test'],
      })
    );
    const entity = change.includes('exclusion') ? FeatureFlagSegmentExclusion : FeatureFlagSegmentInclusion;
    apply = (manager) =>
      manager.getRepository(entity).insert({
        featureFlagId: flag.id,
        segmentId: referenced.id,
        enabled: false,
        listType: STANDARD_LIST_TYPE.SEGMENT,
      });
  } else {
    const parent = await createSegment(db);
    apply = (manager) => manager.createQueryBuilder().relation(Segment, 'subSegments').of(parent.id).add(referenced.id);
    if (change === 'parent list type') {
      await db.getRepository(Segment).update(referenced.id, { listType: STANDARD_LIST_TYPE.INDIVIDUAL });
      await apply(db.manager);
      apply = (manager) =>
        manager.getRepository(Segment).update(referenced.id, { listType: STANDARD_LIST_TYPE.SEGMENT });
    }
  }
  return { target, referenced, apply, writerCanFinishAfterDeletion: nested };
};

const backendPid = async (manager: EntityManager) =>
  Number((await manager.query('SELECT pg_backend_pid() AS pid'))[0].pid);

// Observe an actual PostgreSQL lock dependency; no sleep duration determines transaction ordering.
const waitForBlock = async (db: DataSource, blocked: number, blocker: number) => {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const [{ waiting }] = await db.query('SELECT $2::integer = ANY(pg_blocking_pids($1::integer)) AS waiting', [
      blocked,
      blocker,
    ]);
    if (waiting) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error(`Expected PostgreSQL backend ${blocked} to wait for ${blocker}`);
};

const startWriter = async (db: DataSource) => {
  const writer = db.createQueryRunner();
  await writer.connect();
  await writer.startTransaction();
  await writer.query("SET LOCAL lock_timeout = '8s'");
  return writer;
};
const closeWriter = async (writer: QueryRunner) => {
  if (writer.isTransactionActive) await writer.rollbackTransaction();
  await writer.release();
};

export function registerSegmentDeletionGuardTests(connections: () => [DataSource, DataSource]) {
  describe('Segment deletion guard', () => {
    const logger = new UpgradeLogger();
    let db: DataSource;
    let writerDb: DataSource;
    let service: SegmentService;
    let deletionRepository: DeletionRepository;
    const assertSegmentDeletionAllowed = (id: string, manager: EntityManager) =>
      assertAllowed(id, manager, deletionRepository);
    beforeEach(() => {
      [db, writerDb] = connections();
      service = Container.get(SegmentService);
      deletionRepository = repositoryContainer.getCustomRepository(DeletionRepository);
    });

    const status = async (id: string) => {
      const segment = await db
        .getRepository(Segment)
        .findOneOrFail({ where: { id }, relations: { subSegments: true } });
      const result = (await service.getSegmentStatus([segment])).segmentsData[0] as SegmentWithStatus;
      return result.status;
    };

    test.each(changes)('%s committed before the guard is rejected', async (change) => {
      const fixture = await createChange(db, change);
      expect(await status(fixture.target.id)).toBe(SEGMENT_STATUS.UNUSED);
      await fixture.apply(writerDb.manager);
      expect(await status(fixture.target.id)).toBe(SEGMENT_STATUS.USED);
      await expect(
        service.deleteSegment(fixture.target.id, logger, (manager) =>
          assertSegmentDeletionAllowed(fixture.target.id, manager)
        )
      ).rejects.toMatchObject({ reason: 'used' });
      expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: fixture.target.id })).toBe(1);
    });

    test.each(changes)(
      '%s in progress is awaited and then rejected',
      async (change) => {
        const fixture = await createChange(db, change);
        expect(await status(fixture.target.id)).toBe(SEGMENT_STATUS.UNUSED);
        const writer = await startWriter(writerDb);
        const entered = barrier();
        let deleterPid: number;
        let deletion: ReturnType<typeof outcome>;
        try {
          const writerPid = await backendPid(writer.manager);
          await fixture.apply(writer.manager);
          deletion = outcome(
            service.deleteSegment(fixture.target.id, logger, async (manager) => {
              deleterPid = await backendPid(manager);
              entered.release();
              await assertSegmentDeletionAllowed(fixture.target.id, manager);
            })
          );
          await waitForBarrier(entered, deletion);
          expect(deleterPid).not.toBe(writerPid);
          await waitForBlock(db, deleterPid, writerPid);
          await writer.commitTransaction();
          expect((await deletion).error).toMatchObject({ reason: 'used' });
          expect(await db.getRepository(Segment).countBy({ id: fixture.target.id })).toBe(1);
          expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: fixture.target.id })).toBe(1);
        } finally {
          await closeWriter(writer);
          await deletion;
        }
      },
      15000
    );

    test.each(changes)(
      '%s waits until an already guarded deletion commits',
      async (change) => {
        const fixture = await createChange(db, change);
        expect(await status(fixture.target.id)).toBe(SEGMENT_STATUS.UNUSED);
        const writer = await startWriter(writerDb);
        const guarded = barrier();
        const finish = barrier();
        let deleterPid: number;
        const deletion = outcome(
          service.deleteSegment(fixture.target.id, logger, async (manager) => {
            deleterPid = await backendPid(manager);
            await assertSegmentDeletionAllowed(fixture.target.id, manager);
            guarded.release();
            await finish.reached;
          })
        );
        let writing: ReturnType<typeof outcome>;
        try {
          await waitForBarrier(guarded, deletion);
          const writerPid = await backendPid(writer.manager);
          expect(deleterPid).not.toBe(writerPid);
          writing = outcome(fixture.apply(writer.manager));
          await waitForBlock(db, writerPid, deleterPid);
          finish.release();
          expect((await deletion).error).toBeUndefined();
          const result = await writing;
          if (fixture.writerCanFinishAfterDeletion) {
            expect(result.error).toBeUndefined();
            await writer.commitTransaction();
          } else {
            expect(result.error).toMatchObject({ code: '23503' });
            await writer.rollbackTransaction();
          }
          expect(await db.getRepository(Segment).countBy({ id: fixture.target.id })).toBe(0);
        } finally {
          finish.release();
          await writing;
          await closeWriter(writer);
          await deletion;
        }
      },
      15000
    );

    test.each(['commit', 'rollback'] as const)(
      'bounds lock waits without leaking the setting after %s',
      async (completion) => {
        const target = await createSegment(db);
        const runner = db.createQueryRunner();
        await runner.connect();
        const [original] = await runner.query('SHOW lock_timeout');
        try {
          for (const [configured, expected] of [
            ['0', '5s'],
            ['30s', '5s'],
            ['200ms', '200ms'],
          ]) {
            await runner.query("SELECT set_config('lock_timeout', $1, false)", [configured]);
            await runner.startTransaction();
            await assertSegmentDeletionAllowed(target.id, runner.manager);
            expect(await runner.query('SHOW lock_timeout')).toEqual([{ lock_timeout: expected }]);
            if (completion === 'commit') await runner.commitTransaction();
            else await runner.rollbackTransaction();
            // Check the same pinned connection, not an arbitrary pooled connection.
            expect(await runner.query('SHOW lock_timeout')).toEqual([{ lock_timeout: configured }]);
          }
        } finally {
          if (runner.isTransactionActive) await runner.rollbackTransaction();
          await runner.query("SELECT set_config('lock_timeout', $1, false)", [original.lock_timeout]);
          await runner.release();
        }
      }
    );

    test.each(['target', 'ancestor', 'experiment owner', 'private cleanup'] as const)(
      'a lock timeout during %s rejects deletion and rolls back prior writes',
      async (blockedAt) => {
        const fixture = await createChange(db, 'archived owner state');
        const child = blockedAt === 'private cleanup' ? await createSegment(db, SEGMENT_TYPE.PRIVATE) : undefined;
        if (child) {
          await db.createQueryBuilder().relation(Segment, 'subSegments').of(fixture.target.id).add(child.id);
        }
        const writer = await startWriter(writerDb);
        let guardPassed = false;
        try {
          if (blockedAt === 'experiment owner') {
            await writer.query(
              `SELECT id FROM experiment WHERE id IN (
                SELECT "experimentId" FROM experiment_segment_inclusion WHERE "segmentId" = $1
              ) FOR UPDATE`,
              [fixture.referenced.id]
            );
          } else {
            const lockedId = child?.id ?? (blockedAt === 'ancestor' ? fixture.referenced.id : fixture.target.id);
            await writer.query('SELECT id FROM segment WHERE id = $1 FOR UPDATE', [lockedId]);
          }
          const writerPid = await backendPid(writer.manager);
          await expect(
            service.deleteSegment(fixture.target.id, logger, async (manager) => {
              expect(await backendPid(manager)).not.toBe(writerPid);
              // A tighter transaction budget keeps this contention test fast and must be preserved.
              await manager.query("SET LOCAL lock_timeout = '200ms'");
              await manager.getRepository(IndividualForSegment).delete({ segmentId: fixture.target.id });
              await assertSegmentDeletionAllowed(fixture.target.id, manager);
              guardPassed = true;
            })
          ).rejects.toMatchObject({ code: '55P03' });
          // The writer still holds its lock: failure comes from the timeout, not releasing the blocker.
          expect(writer.isTransactionActive).toBe(true);
          expect(guardPassed).toBe(blockedAt === 'private cleanup');
          expect(await db.getRepository(Segment).countBy({ id: fixture.target.id })).toBe(1);
          expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: fixture.target.id })).toBe(1);
          if (child) expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(1);
        } finally {
          await closeWriter(writer);
        }
      },
      15000
    );

    test('rejects missing/protected targets and calls without a transaction', async () => {
      await expect(assertSegmentDeletionAllowed(randomUUID(), db.manager)).rejects.toThrow('active transaction');
      await expect(
        db.transaction('REPEATABLE READ', (manager) => assertSegmentDeletionAllowed(randomUUID(), manager))
      ).rejects.toThrow('READ COMMITTED');
      await expect(
        db.transaction((manager) => assertSegmentDeletionAllowed(randomUUID(), manager))
      ).rejects.toMatchObject({ reason: 'missing' });
      for (const type of [SEGMENT_TYPE.PRIVATE, SEGMENT_TYPE.GLOBAL_EXCLUDE]) {
        const segment = await createSegment(db, type);
        await expect(
          service.deleteSegment(segment.id, logger, (manager) => assertSegmentDeletionAllowed(segment.id, manager))
        ).rejects.toMatchObject({ reason: 'protected' });
        expect(await db.getRepository(Segment).countBy({ id: segment.id })).toBe(1);
      }
    });

    test('guard rollback preserves prior writes and legacy deletion remains available', async () => {
      const fixture = await createChange(db, 'flag inclusion');
      await fixture.apply(db.manager);
      await expect(
        service.deleteSegment(fixture.target.id, logger, async (manager) => {
          await manager.getRepository(IndividualForSegment).delete({ segmentId: fixture.target.id });
          await assertSegmentDeletionAllowed(fixture.target.id, manager);
        })
      ).rejects.toMatchObject({ reason: 'used' });
      expect(await db.getRepository(IndividualForSegment).countBy({ segmentId: fixture.target.id })).toBe(1);
      await expect(service.deleteSegment(fixture.target.id, logger)).resolves.toMatchObject({ id: fixture.target.id });
    });

    test('guarded deletion awaits private cleanup without global status loaders', async () => {
      const child = await createSegment(db, SEGMENT_TYPE.PRIVATE);
      const target = await createSegment(db, SEGMENT_TYPE.PUBLIC, [child]);
      const spies = [
        'getSegmentStatus',
        'getExperimentSegmentInclusionData',
        'getExperimentSegmentExclusionData',
        'getFeatureFlagSegmentInclusionData',
        'getFeatureFlagSegmentExclusionData',
        'getParentSegments',
      ].map((method) => jest.spyOn(service as any, method));
      try {
        await service.deleteSegment(target.id, logger, (manager) => assertSegmentDeletionAllowed(target.id, manager));
        expect(await db.getRepository(Segment).countBy({ id: child.id })).toBe(0);
        spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
      } finally {
        spies.forEach((spy) => spy.mockRestore());
      }
    });
  });
}
