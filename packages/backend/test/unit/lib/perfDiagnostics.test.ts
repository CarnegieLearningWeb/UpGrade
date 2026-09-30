import { caching } from 'cache-manager';
import { instrumentCacheStore, startPerfDiagnostics, timeCacheLoad } from '../../../src/lib/perfDiagnostics';

describe('startPerfDiagnostics', () => {
  const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('writes a perfdiag line with event loop, gc, and pool stats', async () => {
    const pool = { totalCount: 4, idleCount: 1, waitingCount: 2, options: { max: 10 } };
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
    expect(parsed.dbPool).toEqual({ maxWaitingForConnection: 2, maxConnectionsInUse: 3, poolSize: 10 });
    expect(parsed.cacheWrites).toEqual({
      count: expect.any(Number),
      totalMs: expect.any(Number),
      maxMs: expect.any(Number),
      maxKey: null,
    });
    expect(typeof parsed.heapUsedMb).toBe('number');
  });

  it('reports a null pool instead of throwing when the driver has no pg pool', async () => {
    const lines: string[] = [];
    const stop = startPerfDiagnostics({ driver: {} } as any, {
      sampleMs: 10,
      reportMs: 50,
      write: (l) => lines.push(l),
    });

    await waitFor(120);
    stop();

    expect(JSON.parse(lines[0]).dbPool).toBeNull();
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
    instrumentCacheStore(cache.store as any, (line) => lines.push(line), 0);

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

  it('still stores the value and skips the per-write line below the threshold', async () => {
    const cache = await caching('memory', { max: 10, ttl: 60000 });
    const lines: string[] = [];
    instrumentCacheStore(cache.store as any, (line) => lines.push(line), 10000);

    await cache.set('small', { a: 1 });
    await flush();

    expect(await cache.get('small')).toEqual({ a: 1 });
    expect(lines).toHaveLength(0);
  });
});
