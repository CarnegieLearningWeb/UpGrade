import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualExperimentWithMetric } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { Log } from '../../../../src/api/models/Log';
import { systemUser } from '../../mockData/user/index';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';

export default async function CreateLog(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentObject = individualExperimentWithMetric;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);
  const logRepository = getRepository(Log);

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
        metrics: expect.arrayContaining(
          experimentObject.metrics.map((matrix) => {
            return expect.objectContaining(matrix);
          })
        ),
      }),
    ])
  );

  let totalMetrics = await metricRepository.count();
  expect(totalMetrics).toEqual(3);

  const experimentUser = experimentUsers[0];
  const jsonData = {
    w: { time: 200, completion: 50, name: 'Vivek' },
  };

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData);

  let logData = await logRepository.find({
    relations: ['metrics'],
  });

  // check for log data created and metrics relation
  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: { w: { time: 200, completion: 50 } },
        metrics: expect.arrayContaining([
          expect.objectContaining({
            key: 'w_time',
          }),
          expect.objectContaining({
            key: 'w_completion',
          }),
        ]),
      }),
    ])
  );

  // delete experiment
  await experimentService.delete(experiments[0].id, user);

  experiments = await experimentService.find();
  expect(experiments.length).toEqual(0);

  totalMetrics = await metricRepository.count();
  expect(totalMetrics).toEqual(0);

  logData = await logRepository.find({});
  expect(logData.length).toEqual(0);
}
