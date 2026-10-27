import { caching } from 'cache-manager';
import {
  instrumentCacheStore,
  PERFDIAG_CACHE_EVENT_TYPE,
  PERFDIAG_EVENT_TYPE,
  startPerfDiagnostics,
  timeCacheLoad,
  toEventAttributes,
} from '../../../src/lib/perfDiagnostics';

type RecordedEvent = [string, Record<string, string | number | boolean>];

describe('startPerfDiagnostics', () => {
  const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('writes a perfdiag line with event loop, gc, and pool stats', async () => {
    const pool = {
      totalCount: 4,
      idleCount: 1,
      waitingCount: 2,
      options: { max: 10, min: 0, idleTimeoutMillis: 10000, maxLifetimeSeconds: 0, keepAlive: false },
    };
    const lines: string[] = [];
    const stop = startPerfDiagnostics({ driver: { master: pool } } as any, {
      sampleMs: 10,
      reportMs: 100,
      write: (line) => lines.push(line),
    });

    await waitFor(250);
    stop();

    expect(lines.length).toBeGreaterThanOrEqual(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.tag).toBe('perfdiag');
    expect(typeof parsed.instanceId).toBe('string');
    expect(typeof parsed.eventLoopBusyPct).toBe('number');
    expect(parsed.eventLoopDelayMs).toEqual({
      p50: expect.any(Number),
      p99: expect.any(Number),
      max: expect.any(Number),
    });
    expect(parsed.garbageCollection.major).toEqual({
      count: expect.any(Number),
      totalMs: expect.any(Number),
      maxMs: expect.any(Number),
    });
    expect(parsed.dbPool).toEqual({ maxWaitingForConnection: 2, maxConnectionsInUse: 3, currentPoolSize: 4 });
    expect(parsed.dbPoolConfig).toEqual({
      maxPoolSize: 10,
      minPoolSize: 0,
      idleTimeoutMillis: 10000,
      maxLifetimeSeconds: 0,
      keepAlive: false,
      keepAliveInitialDelayMillis: null,
    });
    expect(parsed.cacheWrites).toEqual({
      count: expect.any(Number),
      totalMs: expect.any(Number),
      maxMs: expect.any(Number),
      maxKey: null,
    });
    expect(typeof parsed.heapUsedMb).toBe('number');
  });

  it('records each report as a PerfDiag event with the log line fields, flattened', async () => {
    const pool = {
      totalCount: 4,
      idleCount: 1,
      waitingCount: 2,
      options: { max: 10, min: 0, idleTimeoutMillis: 10000, maxLifetimeSeconds: 0, keepAlive: false },
    };
    const lines: string[] = [];
    const events: RecordedEvent[] = [];
    const stop = startPerfDiagnostics({ driver: { master: pool } } as any, {
      sampleMs: 10,
      reportMs: 100,
      write: (line) => lines.push(line),
      recordEvent: (eventType, attributes) => events.push([eventType, attributes]),
    });

    await waitFor(250);
    stop();

    expect(events.length).toBe(lines.length);
    const [eventType, attributes] = events[0];
    const logged = JSON.parse(lines[0]);
    delete logged.tag;
    delete logged.ts;
    expect(eventType).toBe(PERFDIAG_EVENT_TYPE);
    expect(attributes).toEqual(toEventAttributes(logged));
    expect(attributes).toMatchObject({
      instanceId: expect.any(String),
      'eventLoopDelayMs.p99': expect.any(Number),
      'garbageCollection.major.maxMs': expect.any(Number),
      'dbPool.maxWaitingForConnection': 2,
      'dbPool.maxConnectionsInUse': 3,
      'dbPoolConfig.maxPoolSize': 10,
      'dbPoolConfig.keepAlive': false,
    });
    expect(Object.keys(attributes)).not.toContain('dbPoolConfig.keepAliveInitialDelayMillis');
    expect(Object.keys(attributes)).not.toContain('cacheWrites.maxKey');
  });

  it('reports a null pool instead of throwing when the driver has no pg pool', async () => {
    const lines: string[] = [];
    const events: RecordedEvent[] = [];
    const stop = startPerfDiagnostics({ driver: {} } as any, {
      sampleMs: 10,
      reportMs: 50,
      write: (l) => lines.push(l),
      recordEvent: (eventType, attributes) => events.push([eventType, attributes]),
    });

    await waitFor(120);
    stop();

    expect(JSON.parse(lines[0]).dbPool).toBeNull();
    expect(JSON.parse(lines[0]).dbPoolConfig).toBeNull();
    expect(Object.keys(events[0][1]).filter((name) => name.startsWith('dbPool'))).toEqual([]);
  });

  it('stops writing after the returned stop function is called', async () => {
    const lines: string[] = [];
    const stop = startPerfDiagnostics({ driver: {} } as any, {
      sampleMs: 10,
      reportMs: 30,
      write: (l) => lines.push(l),
    });

    stop();
    await waitFor(100);

    expect(lines).toHaveLength(0);
  });
});

describe('cache write instrumentation', () => {
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const bigValue = () =>
    Array.from({ length: 20000 }, (_, i) => ({ id: `exp-${i}`, conditions: [{ code: 'a' }, { code: 'b' }] }));

  it('logs slow writes to the real memory store with key, kind, load time, and item count', async () => {
    const cache = await caching('memory', { max: 10, ttl: 60000 });
    const lines: string[] = [];
    instrumentCacheStore(
      cache.store as any,
      (line) => lines.push(line),
      0,
      () => undefined
    );

    const load = timeCacheLoad('experiments:assign-prog', async () => bigValue());
    await cache.wrap('experiments:assign-prog', load);
    await cache.set('experiments:assign-prog', bigValue());
    await flush();

    expect(lines.map((line) => JSON.parse(line))).toEqual([
      expect.objectContaining({
        tag: 'perfdiag-cache',
        key: 'experiments:assign-prog',
        kind: 'miss',
        writeMs: expect.any(Number),
        loadMs: expect.any(Number),
        items: 20000,
      }),
      expect.objectContaining({ key: 'experiments:assign-prog', kind: 'refresh', loadMs: null }),
    ]);
  });

  it('records each slow write as a PerfDiagCacheWrite event, leaving off a missing load time', async () => {
    const cache = await caching('memory', { max: 10, ttl: 60000 });
    const events: RecordedEvent[] = [];
    instrumentCacheStore(
      cache.store as any,
      () => undefined,
      0,
      (eventType, attributes) => events.push([eventType, attributes])
    );

    const load = timeCacheLoad('experiments:assign-prog', async () => bigValue());
    await cache.wrap('experiments:assign-prog', load);
    await cache.set('experiments:assign-prog', bigValue());
    await flush();

    expect(events).toEqual([
      [
        PERFDIAG_CACHE_EVENT_TYPE,
        {
          instanceId: expect.any(String),
          key: 'experiments:assign-prog',
          kind: 'miss',
          writeMs: expect.any(Number),
          loadMs: expect.any(Number),
          items: 20000,
        },
      ],
      [
        PERFDIAG_CACHE_EVENT_TYPE,
        {
          instanceId: expect.any(String),
          key: 'experiments:assign-prog',
          kind: 'refresh',
          writeMs: expect.any(Number),
          items: 20000,
        },
      ],
    ]);
  });

  it('still stores the value and skips the per-write line below the threshold', async () => {
    const cache = await caching('memory', { max: 10, ttl: 60000 });
    const lines: string[] = [];
    const events: RecordedEvent[] = [];
    instrumentCacheStore(
      cache.store as any,
      (line) => lines.push(line),
      10000,
      (eventType, attributes) => events.push([eventType, attributes])
    );

    await cache.set('small', { a: 1 });
    await flush();

    expect(await cache.get('small')).toEqual({ a: 1 });
    expect(lines).toHaveLength(0);
    expect(events).toHaveLength(0);
  });
});

describe('toEventAttributes', () => {
  it('flattens nested fields to dotted names and drops nulls', () => {
    expect(toEventAttributes({ a: 1, b: { c: 'x', d: null, e: { f: true } }, g: null })).toEqual({
      a: 1,
      'b.c': 'x',
      'b.e.f': true,
    });
  });
});
