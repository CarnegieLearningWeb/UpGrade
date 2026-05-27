import 'reflect-metadata';
import { MicroframeworkSettings } from 'microframework';
import { SERVER_ERROR } from 'upgrade_types';

/**
 * Strategy for mocking module-level singletons
 * -----------------------------------------------
 * typeormLoader creates two DataSource instances at *module load time*
 * (not inside the exported function).  We can't replace those after the
 * fact, so instead we make the jest.mock factory store the two mock
 * instances as well-known properties on the mocked DataSource constructor
 * itself.  After the module is imported we pull those properties out into
 * typed local variables and reset/configure them per test.
 *
 * The same trick is applied to UpgradeLogger so we can inspect log calls
 * without fighting TDZ issues that come with jest.mock factory hoisting.
 */

// ─── TypeORM mock ────────────────────────────────────────────────────────────
// jest.mock calls are hoisted before all import statements by Jest's transformer,
// so we must not reference any `let`/`const` variables from this file inside
// the factory — they are in the temporal dead zone at that point.
jest.mock('typeorm', () => {
  const mainInst = {
    initialize: jest.fn(),
    runMigrations: jest.fn(),
    destroy: jest.fn(),
  };
  const replicaInst = {
    initialize: jest.fn(),
    runMigrations: jest.fn(),
    destroy: jest.fn(),
  };

  // The loader calls `new DataSource(...)` twice at module load time:
  // first call → main connection, second call → replica connection.
  let callCount = 0;
  const instances = [mainInst, replicaInst];
  const MockDataSource = jest.fn().mockImplementation(() => instances[callCount++]);

  // Stash references so the test body can reach them after import.
  (MockDataSource as any).__main = mainInst;
  (MockDataSource as any).__replica = replicaInst;

  return { DataSource: MockDataSource };
});

// ─── UpgradeLogger mock ───────────────────────────────────────────────────────
jest.mock('../../../src/lib/logger/UpgradeLogger', () => {
  const errorFn = jest.fn();
  const MockLogger = jest.fn().mockImplementation(() => ({
    error: errorFn,
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }));
  // Stash the error spy so we can assert on it from the test body.
  (MockLogger as any).__error = errorFn;
  return { UpgradeLogger: MockLogger };
});

// ─── typeorm-typedi-extensions Container mock ─────────────────────────────────
jest.mock('../../../src/typeorm-typedi-extensions', () => ({
  Container: { setDataSource: jest.fn() },
}));

// ─── env mock ─────────────────────────────────────────────────────────────────
// Returns a plain mutable object so individual tests can change `synchronize`
// or `isECS` without re-loading the module.
jest.mock('../../../src/env', () => ({
  env: {
    db: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
      host_replica: null,
      synchronize: false,
      logging: false,
      maxQueryExecutionTime: 1000,
      maxConnectionPool: 10,
    },
    app: { dirs: { entities: [], migrations: [] } },
    isECS: false,
  },
}));

// ─── Imports (resolved after mocks are registered) ───────────────────────────
import { DataSource } from 'typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { env } from '../../../src/env';
import { typeormLoader } from '../../../src/loaders/typeormLoader';

// ─── Typed handles into the mock internals ───────────────────────────────────
const mainInstance = (DataSource as any).__main as {
  initialize: jest.Mock;
  runMigrations: jest.Mock;
  destroy: jest.Mock;
};
const replicaInstance = (DataSource as any).__replica as {
  initialize: jest.Mock;
  runMigrations: jest.Mock;
  destroy: jest.Mock;
};
const mockLogError = (UpgradeLogger as any).__error as jest.Mock;
const mockSetDataSource = Container.setDataSource as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────

describe('typeormLoader', () => {
  let mockSettings: MicroframeworkSettings;

  beforeEach(() => {
    // Reset call history and implementations for every test.
    mainInstance.initialize.mockReset();
    mainInstance.runMigrations.mockReset();
    replicaInstance.initialize.mockReset();
    replicaInstance.runMigrations.mockReset();
    mockLogError.mockReset();
    mockSetDataSource.mockReset();

    // Default behaviour: both connections succeed, migrations pass.
    mainInstance.initialize.mockResolvedValue(undefined);
    mainInstance.runMigrations.mockResolvedValue([]);
    replicaInstance.initialize.mockResolvedValue(undefined);

    // Restore env flags to their defaults.
    (env.db as any).synchronize = false;
    (env as any).isECS = false;

    mockSettings = {
      setData: jest.fn(),
      onShutdown: jest.fn(),
    } as unknown as MicroframeworkSettings;
  });

  // ── Scenario 1: happy path ──────────────────────────────────────────────────
  describe('when both connections succeed', () => {
    test('resolves without throwing', async () => {
      await expect(typeormLoader(mockSettings)).resolves.toBeUndefined();
    });

    test('registers both data sources in the DI container', async () => {
      await typeormLoader(mockSettings);
      expect(mockSetDataSource).toHaveBeenCalledTimes(2);
    });

    test('passes the main connection instance to microframework settings', async () => {
      await typeormLoader(mockSettings);
      expect(mockSettings.setData).toHaveBeenCalledWith('connection', mainInstance);
    });

    test('registers a shutdown handler', async () => {
      await typeormLoader(mockSettings);
      expect(mockSettings.onShutdown).toHaveBeenCalledTimes(1);
    });

    test('runs migrations on the main connection', async () => {
      await typeormLoader(mockSettings);
      expect(mainInstance.runMigrations).toHaveBeenCalledTimes(1);
    });

    test('does not log any errors', async () => {
      await typeormLoader(mockSettings);
      expect(mockLogError).not.toHaveBeenCalled();
    });
  });

  // ── Scenario 2: read replica is down ───────────────────────────────────────
  describe('when the read replica fails to connect', () => {
    const replicaError = Object.assign(new Error('replica host unreachable'), { code: 'ECONNREFUSED' });

    beforeEach(() => {
      replicaInstance.initialize.mockRejectedValue(replicaError);
    });

    test('does NOT throw — app continues booting without the replica', async () => {
      await expect(typeormLoader(mockSettings)).resolves.toBeUndefined();
    });

    test('logs the replica connection error', async () => {
      await typeormLoader(mockSettings);
      expect(mockLogError).toHaveBeenCalledTimes(1);
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('replica'),
          error: replicaError,
        })
      );
    });

    test('still registers the main connection with microframework settings', async () => {
      await typeormLoader(mockSettings);
      expect(mockSettings.setData).toHaveBeenCalledWith('connection', mainInstance);
    });

    test('still runs migrations on the main connection', async () => {
      await typeormLoader(mockSettings);
      expect(mainInstance.runMigrations).toHaveBeenCalledTimes(1);
    });

    test('does not run migrations on the failed replica', async () => {
      await typeormLoader(mockSettings);
      expect(replicaInstance.runMigrations).not.toHaveBeenCalled();
    });
  });

  // ── Scenario 3: main database is unreachable ────────────────────────────────
  describe('when the main database cannot be reached (ECONNREFUSED)', () => {
    const mainError = Object.assign(new Error('main host unreachable'), { code: 'ECONNREFUSED' });

    beforeEach(() => {
      mainInstance.initialize.mockRejectedValue(mainError);
    });

    test('throws — app cannot start', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toThrow();
    });

    test('classifies the thrown error as SERVER_ERROR.DB_UNREACHABLE', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toMatchObject({
        type: SERVER_ERROR.DB_UNREACHABLE,
      });
    });

    test('logs the error before throwing', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toThrow();
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Database connection failed' })
      );
    });

    test('does not pass anything to microframework settings — the app never boots', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toThrow();
      expect(mockSettings.setData).not.toHaveBeenCalled();
    });

    test('does not run migrations when the main DB is unreachable', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toThrow();
      expect(mainInstance.runMigrations).not.toHaveBeenCalled();
    });
  });

  // ── Scenario 4: migration fails after connecting ────────────────────────────
  describe('when a migration fails (postgres error 42P07 — duplicate table)', () => {
    const migrationError = Object.assign(new Error('relation "foo" already exists'), { code: '42P07' });

    beforeEach(() => {
      mainInstance.runMigrations.mockRejectedValue(migrationError);
    });

    test('throws — app cannot start', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toThrow();
    });

    test('classifies the thrown error as SERVER_ERROR.MIGRATION_ERROR', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toMatchObject({
        type: SERVER_ERROR.MIGRATION_ERROR,
      });
    });
  });

  // ── Scenario 5: both fail simultaneously ───────────────────────────────────
  describe('when both the main DB and the replica fail', () => {
    const mainError = Object.assign(new Error('main unreachable'), { code: 'ECONNREFUSED' });
    const replicaError = new Error('replica unreachable');

    beforeEach(() => {
      mainInstance.initialize.mockRejectedValue(mainError);
      replicaInstance.initialize.mockRejectedValue(replicaError);
    });

    test('throws based on the main DB error (not the replica error)', async () => {
      await expect(typeormLoader(mockSettings)).rejects.toMatchObject({
        message: 'main unreachable',
        type: SERVER_ERROR.DB_UNREACHABLE,
      });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    test('works correctly when microframework settings is undefined', async () => {
      await expect(typeormLoader(undefined)).resolves.toBeUndefined();
    });

    test('skips migrations when env.db.synchronize is true', async () => {
      (env.db as any).synchronize = true;
      await typeormLoader(mockSettings);
      expect(mainInstance.runMigrations).not.toHaveBeenCalled();
    });

    test('skips migrations when running in ECS', async () => {
      (env as any).isECS = true;
      await typeormLoader(mockSettings);
      expect(mainInstance.runMigrations).not.toHaveBeenCalled();
    });
  });
});
