import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualExperimentWithMetric } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';

export default async function MetricCRUD(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentObject = individualExperimentWithMetric;
  const userService = Container.get<UserService>(UserService);
  const metricRepository = getRepository(Metric);

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

  // edited matrix
  const editedMetrics = experiments[0].metrics.map((matrix) => {
    return {
      ...matrix,
      key: `Matrix ${matrix.key}`,
    };
  });

  // delete one condition
  editedMetrics.pop();

  const experimentUpdated = {
    ...experiments[0],
    metrics: editedMetrics,
  };

  // update matrix
  await experimentService.update(experimentUpdated.id, experimentUpdated as any, user);
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
        metrics: expect.arrayContaining(
          editedMetrics.map((matrix) => {
            return expect.objectContaining(matrix);
          })
        ),
      }),
    ])
  );

  expect(experiments[0].metrics.length).toEqual(experimentUpdated.metrics.length);

  totalMetrics = await metricRepository.count();
  expect(totalMetrics).toEqual(1);

  // delete the experiment and matrix should be deleted
  await experimentService.delete(experiments[0].id, user);

  experiments = await experimentService.find();
  expect(experiments.length).toEqual(0);

  totalMetrics = await metricRepository.count();
  expect(totalMetrics).toEqual(0);
}
