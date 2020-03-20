import { Container } from 'typedi';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { groupExperimentStats } from '../mockData/experiment/index';
import { AnalyticsService } from '../../../src/api/services/AnalyticsService';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../utils/index';
import { EXPERIMENT_STATE } from 'ees_types';
import { CheckService } from '../../../src/api/services/CheckService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';

export default async function testCase(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const analyticsService = Container.get<AnalyticsService>(AnalyticsService);
  const checkService = Container.get<CheckService>(CheckService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);
  // experiment object
  const experimentObject = groupExperimentStats;

  // create experiment
  await experimentService.create(experimentObject as any, user);
  const experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  const experimentId = experiments[0].id;
  let stats = await analyticsService.getStats([experimentId]);
  let customStats = {
    id: experimentId,
    users: 0,
    group: 0,
    userExcluded: 0,
    groupExcluded: 0,
    conditions: experiments[0].conditions.map(condition => {
      return {
        id: condition.id,
        user: 0,
        group: 0,
      };
    }),
    partitions: experiments[0].partitions.map(partition => {
      return {
        id: partition.id,
        user: 0,
        group: 0,
        conditions: experiments[0].conditions.map(condition => {
          return {
            id: condition.id,
            user: 0,
            group: 0,
          };
        }),
      };
    }),
  };

  // check when no stats in database
  checkStatsObject(stats[0], customStats);

  const experimentName1 = experimentObject.partitions[0].name;
  const experimentPoint1 = experimentObject.partitions[0].point;

  const experimentName2 = experimentObject.partitions[1].name;
  const experimentPoint2 = experimentObject.partitions[1].point;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  // check stats
  stats = await analyticsService.getStats([experimentId]);
  checkStatsObject(stats[0], customStats);

  // change experiment state to scheduled
  const date = new Date();
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.SCHEDULED, user, date);

  // user 1 logs in experiment
  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName1, experimentPoint1);

  // user 2 logs in experiment
  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  // check stats
  stats = await analyticsService.getStats([experimentId]);
  checkStatsObject(stats[0], customStats);

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // check state
  stats = await analyticsService.getStats([experimentId]);
  checkStatsObject(stats[0], { ...customStats, userExcluded: 2, groupExcluded: 1 });

  // user 3 logs in experiment
  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName2, experimentPoint2);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName2, experimentPoint2);

  // Check Service
  let individualAssignment = await checkService.getAllIndividualAssignment();
  let monitoredExperimentPoints = await checkService.getAllMarkedExperimentPoints();

  stats = await analyticsService.getStats([experimentId]);
  customStats = {
    id: experimentId,
    users: 1,
    group: 1,
    userExcluded: 2,
    groupExcluded: 1,
    conditions: experiments[0].conditions.map(condition => {
      const conditionAssigned = individualAssignment.filter(assignedExperiment => {
        return assignedExperiment.condition.id === condition.id;
      });
      return {
        id: condition.id,
        user: conditionAssigned.length,
        group: conditionAssigned.length,
      };
    }),
    partitions: experiments[0].partitions.map(partition => {
      const conditions = experiments[0].conditions.map(condition => {
        const conditionAssigned = individualAssignment.filter(assignedExperiment => {
          const conditionIsSame = assignedExperiment.condition.id === condition.id;
          const userId = assignedExperiment.userId;
          const isInMonitoredPoint = monitoredExperimentPoints.find(monitoredPoint => {
            return monitoredPoint.id === partition.id && monitoredPoint.userId === userId;
          });
          return conditionIsSame && isInMonitoredPoint;
        });
        return {
          id: condition.id,
          user: conditionAssigned.length,
          group: conditionAssigned.length,
        };
      });
      return {
        id: partition.id,
        user: conditions.reduce((acc, condition) => acc + condition.user, 0),
        group: conditions.reduce((acc, condition) => acc + condition.user, 0),
        conditions,
      };
    }),
  };
  checkStatsObject(stats[0], { ...customStats });

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[2].id, experimentName1, experimentPoint1);

  individualAssignment = await checkService.getAllIndividualAssignment();
  monitoredExperimentPoints = await checkService.getAllMarkedExperimentPoints();

  stats = await analyticsService.getStats([experimentId]);
  customStats = {
    id: experimentId,
    users: 1,
    group: 1,
    userExcluded: 2,
    groupExcluded: 1,
    conditions: experiments[0].conditions.map(condition => {
      const conditionAssigned = individualAssignment.filter(assignedExperiment => {
        return assignedExperiment.condition.id === condition.id;
      });
      return {
        id: condition.id,
        user: conditionAssigned.length,
        group: conditionAssigned.length,
      };
    }),
    partitions: experiments[0].partitions.map(partition => {
      const conditions = experiments[0].conditions.map(condition => {
        const conditionAssigned = individualAssignment.filter(assignedExperiment => {
          const conditionIsSame = assignedExperiment.condition.id === condition.id;
          const userId = assignedExperiment.userId;
          const isInMonitoredPoint = monitoredExperimentPoints.find(monitoredPoint => {
            return monitoredPoint.id === partition.id && monitoredPoint.userId === userId;
          });
          return conditionIsSame && isInMonitoredPoint;
        });
        return {
          id: condition.id,
          user: conditionAssigned.length,
          group: conditionAssigned.length,
        };
      });
      return {
        id: partition.id,
        user: conditions.reduce((acc, condition) => acc + condition.user, 0),
        group: conditions.reduce((acc, condition) => acc + condition.user, 0),
        conditions,
      };
    }),
  };
  // console.log(JSON.stringify(stats, null, 2));
  // console.log(JSON.stringify(customStats, null, 2));
  checkStatsObject(stats[0], { ...customStats });

  // change experiment state to enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);

  // user 3 logs in experiment
  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName1, experimentPoint1);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName1, experimentPoint1);

  individualAssignment = await checkService.getAllIndividualAssignment();
  monitoredExperimentPoints = await checkService.getAllMarkedExperimentPoints();

  stats = await analyticsService.getStats([experimentId]);
  customStats = {
    id: experimentId,
    users: 1,
    group: 1,
    userExcluded: 3,
    groupExcluded: 1,
    conditions: experiments[0].conditions.map(condition => {
      const conditionAssigned = individualAssignment.filter(assignedExperiment => {
        return assignedExperiment.condition.id === condition.id;
      });
      return {
        id: condition.id,
        user: conditionAssigned.length,
        group: conditionAssigned.length,
      };
    }),
    partitions: experiments[0].partitions.map(partition => {
      const conditions = experiments[0].conditions.map(condition => {
        const conditionAssigned = individualAssignment.filter(assignedExperiment => {
          const conditionIsSame = assignedExperiment.condition.id === condition.id;
          const userId = assignedExperiment.userId;
          const isInMonitoredPoint = monitoredExperimentPoints.find(monitoredPoint => {
            return monitoredPoint.id === partition.id && monitoredPoint.userId === userId;
          });
          return conditionIsSame && isInMonitoredPoint;
        });
        return {
          id: condition.id,
          user: conditionAssigned.length,
          group: conditionAssigned.length,
        };
      });
      return {
        id: partition.id,
        user: conditions.reduce((acc, condition) => acc + condition.user, 0),
        group: conditions.reduce((acc, condition) => acc + condition.user, 0),
        conditions,
      };
    }),
  };
  checkStatsObject(stats[0], { ...customStats });

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName2, experimentPoint2);
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[3].id, experimentName2, experimentPoint2);

  individualAssignment = await checkService.getAllIndividualAssignment();
  monitoredExperimentPoints = await checkService.getAllMarkedExperimentPoints();

  stats = await analyticsService.getStats([experimentId]);
  customStats = {
    id: experimentId,
    users: 1,
    group: 1,
    userExcluded: 3,
    groupExcluded: 1,
    conditions: experiments[0].conditions.map(condition => {
      const conditionAssigned = individualAssignment.filter(assignedExperiment => {
        return assignedExperiment.condition.id === condition.id;
      });
      return {
        id: condition.id,
        user: conditionAssigned.length,
        group: conditionAssigned.length,
      };
    }),
    partitions: experiments[0].partitions.map(partition => {
      const conditions = experiments[0].conditions.map(condition => {
        const conditionAssigned = individualAssignment.filter(assignedExperiment => {
          const conditionIsSame = assignedExperiment.condition.id === condition.id;
          const userId = assignedExperiment.userId;
          const isInMonitoredPoint = monitoredExperimentPoints.find(monitoredPoint => {
            return monitoredPoint.id === partition.id && monitoredPoint.userId === userId;
          });
          return conditionIsSame && isInMonitoredPoint;
        });
        return {
          id: condition.id,
          user: conditionAssigned.length,
          group: conditionAssigned.length,
        };
      });
      return {
        id: partition.id,
        user: conditions.reduce((acc, condition) => acc + condition.user, 0),
        group: conditions.reduce((acc, condition) => acc + condition.user, 0),
        conditions,
      };
    }),
  };
  checkStatsObject(stats[0], { ...customStats });
}

function checkStatsObject(receivedStats: any, expectedStats: any): void {
  const { conditions, partitions, ...rest } = expectedStats;
  expect(receivedStats).toEqual(expect.objectContaining(rest));
  expect(receivedStats.conditions).toEqual(
    expect.arrayContaining(conditions.map(conditionDoc => expect.objectContaining(conditionDoc)))
  );
  expect(receivedStats.partitions).toEqual(
    expect.arrayContaining(partitions.map(partitionStat => expect.objectContaining(partitionStat)))
  );
}
