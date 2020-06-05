import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { Log } from '../../../../src/api/models/Log';
import { systemUser } from '../../mockData/user/index';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE, OPERATION_TYPES } from 'upgrade_types';
import { getAllExperimentCondition } from '../../utils';
import { checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { DataLogService } from '../../../../src/api/services/DataLogService';
import { MetricService } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { QueryService } from '../../../../src/api/services/QueryService';

export default async function CreateLog(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  const queryService = Container.get<QueryService>(QueryService);
  const logRepository = getRepository(Log);
  const logDataService = Container.get<DataLogService>(DataLogService);

  const user = await userService.create(systemUser as any);

  // create experiment
  await experimentService.create(experimentObject as any, user);
  let experiments = await experimentService.find();
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

  const experimentName = experimentObject.partitions[0].expId;
  const experimentPoint = experimentObject.partitions[0].expPoint;

  await settingService.setClientCheck(false, true);

  const metricUnit = [
    {
      key: 'time',
      children: [],
      metadata: {
        type: 'continuous',
      },
      allowedData: [],
    },
    {
      key: 'w',
      children: [
        {
          key: 'time',
          children: [],
          metadata: {
            type: 'continuous',
          },
          allowedData: [],
        },
        {
          key: 'completion',
          children: [],
          metadata: {
            type: 'categorical',
          },
          allowedData: ['InProgress', 'Complete'],
        },
      ],
    },
  ];

  await metricService.saveAllMetrics(metricUnit as any);

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(3);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  // fetch experiment
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  // log data here
  await experimentAssignmentService.dataLog(experimentUsers[0].id, {
    time: 20,
    w: { time: 0, completion: 100 },
  });

  await experimentAssignmentService.dataLog(experimentUsers[1].id, { time: 200, w: { time: 20, completion: 100 } });

  await experimentAssignmentService.dataLog(experimentUsers[2].id, { time: 100, w: { time: 40, completion: 100 } });

  await experimentAssignmentService.dataLog(experimentUsers[3].id, { time: 50, w: { time: 60, completion: 100 } });

  const query = {
    query: {
      operationType: OPERATION_TYPES.SUM,
    },
    metric: 'time',
    experimentId: experiments[0].id,
  };

  await queryService.saveQuery(query.query, query.metric, query.experimentId);

  const allQuery = await queryService.find();
  expect(allQuery).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        query: { operationType: 'sum' },
        metric: expect.objectContaining({
          key: 'time',
          type: 'continuous',
          allowedData: [],
        }),
      }),
    ])
  );

  let data = await queryService.analyse(allQuery[0].id);
  console.log('Sum time', data);
  // data = await logDataService.analyse(experimentId, ['time'], OPERATION_TYPES.COUNT, '');
  // console.log('Count time', data);
  // data = await logDataService.analyse(experimentId, ['time'], OPERATION_TYPES.AVERAGE, '');
  // console.log('Average time', data);
  // data = await logDataService.analyse(experimentId, ['time'], OPERATION_TYPES.MAX, '');
  // console.log('Maximum time', data);
  // data = await logDataService.analyse(experimentId, ['time'], OPERATION_TYPES.MIN, '');
  // console.log('Minimum time', data);

  // // deep stats
  // data = await logDataService.analyse(experimentId, ['w', 'time'], OPERATION_TYPES.SUM, '');
  // console.log('Sum time deep', data);
}
