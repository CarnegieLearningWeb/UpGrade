import { Connection } from 'typeorm';
import { configureLogger } from '../utils/logger';
import { synchronizeDatabase, createDatabaseConnection, closeDatabase } from '../utils/database';
import { Scenario1, Scenario2, Scenario3, Scenario4, Scenario5, Scenario6 } from './ExperimentServiceTest';
import { IndividualExclude, GroupExclude } from './ExplicitExclude/index';

describe('Integration Tests', () => {
  // -------------------------------------------------------------------------
  // Setup up
  // -------------------------------------------------------------------------

  let connection: Connection;
  beforeAll(async () => {
    configureLogger();
    connection = await createDatabaseConnection();
  });

  beforeEach(async () => {
    await synchronizeDatabase(connection);
  });

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------
  test('Experiment Scenario 1 - Individual Assignment With Individual Consistency', async done => {
    await Scenario1();
    done();
  });

  test('Experiment Scenario 2 - Individual Assignment With Experiment Consistency', async done => {
    await Scenario2();
    done();
  });

  test('Experiment Scenario 3 - Group Assignment With Group Consistency', async done => {
    await Scenario3();
    done();
  });

  test('Experiment Scenario 4 - Group Assignment With Individual Consistency', async done => {
    await Scenario4();
    done();
  });

  test('Experiment Scenario 5 - Group Assignment With Experiment Consistency', async done => {
    await Scenario5();
    done();
  });
  test('Experiment Scenario 6 - Group Switching before assignment Group Assignment With Group Consistency', async done => {
    await Scenario6();
    done();
  });

  test('Individual Exclude', async done => {
    await IndividualExclude();
    done();
  });

//   test('Group Exclude', async done => {
//     await GroupExclude();
//     done();
//   });
});
