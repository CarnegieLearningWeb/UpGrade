import { startPerfDiagnostics } from '../../../src/lib/perfDiagnostics';

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
