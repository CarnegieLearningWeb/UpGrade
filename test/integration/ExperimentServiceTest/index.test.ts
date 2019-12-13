import { Container } from 'typedi';
import { Connection } from 'typeorm';
import { multipleUsers } from '../mockData/users';
import { closeDatabase, createDatabaseConnection, synchronizeDatabase } from '../../utils/database';
import { configureLogger } from '../../utils/logger';
import { UserService } from '../../../src/api/services/UserService';
import Scenario1 from './Scenario1';
import Scenario2 from './Scenario2';
import Scenario3 from './Scenario3';
import Scenario4 from './Scenario4';
import Scenario5 from './Scenario5';
import Scenario6 from './Scenario6';
import { CheckService } from '../../../src/api/services/CheckService';

describe('Experiment Scenario', () => {
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

    const userService = Container.get<UserService>(UserService);
    const checkService = Container.get<CheckService>(CheckService);

    // check all the tables are empty
    const users = await userService.find();
    expect(users.length).toEqual(0);

    const monitoredPoints = await checkService.getAllMarkedExperimentPoints();
    expect(monitoredPoints.length).toEqual(0);

    const groupAssignments = await checkService.getAllGroupAssignments();
    expect(groupAssignments.length).toEqual(0);

    const groupExclusions = await checkService.getAllGroupExclusions();
    expect(groupExclusions.length).toEqual(0);

    const individualAssignments = await checkService.getAllIndividualAssignment();
    expect(individualAssignments.length).toEqual(0);

    const individualExclusions = await checkService.getAllIndividualExclusion();
    expect(individualExclusions.length).toEqual(0);

    // create users over here
    await userService.create(multipleUsers as any);

    // get all user here
    const userList = await userService.find();
    expect(userList.length).toBe(multipleUsers.length);
    multipleUsers.map(user => {
      expect(userList).toContainEqual(user);
    });
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
});
