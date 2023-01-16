import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { firstFactorialExperiment } from '../../mockData/experiment/index';

export default async function FactorialExperimentCRUD(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = firstFactorialExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // sort conditions
  experiments[0].conditions.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));

  // sort decision points
  experiments[0].partitions.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));

  experiments[0].partitions.forEach((partition) => {
    partition.factors.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  });

  experiments[0].partitions.forEach((partition) => {
    partition.factors.forEach((factor) => {
      factor.levels.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
    });
  });

  expect(experiments[0].partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        site: 'geometry',
        target: 'color_shape',
        order: 1,
        factors: expect.arrayContaining([
          expect.objectContaining({
            name: 'Color',
            order: 1,
            levels: expect.arrayContaining([
              expect.objectContaining({
                id: '33333333-1111-4a52-a058-90fac2d03679',
                name: 'Red',
                order: 1,
              }),
              expect.objectContaining({
                id: '44444444-2222-4a52-a058-90fac2d03679',
                name: 'Blue',
                description: 'description of level2',
                alias: 'Dark blue - Blue color Alias',
                order: 2,
              }),
            ]),
          }),
          expect.objectContaining({
            name: 'Shape',
            order: 2,
            levels: expect.arrayContaining([
              expect.objectContaining({
                id: '11111111-1111-4a52-a058-90fac2d03679',
                name: 'Circle',
                order: 1,
              }),
              expect.objectContaining({
                id: '22222222-2222-4a52-a058-90fac2d03679',
                name: 'Rectangle',
                description: 'description of level2',
                alias: 'Square - rectangle alias',
                order: 2,
              }),
            ]),
          }),
        ]),
      }),
    ])
  );

  const updatedPartitions = [
    {
      id: '5e335ac8-28df-463d-86bb-837dcd8240c4',
      twoCharacterId: 'JU',
      site: 'geometry',
      target: 'color and shape',
      description: '',
      order: 1,
      excludeIfReached: false,
      factors: [
        {
          name: 'Color-updated',
          order: 1,
          levels: [
            {
              id: '33333333-1111-4a52-a058-90fac2d03679',
              name: 'Red',
              order: 1,
            },
            {
              id: '44444444-2222-4a52-a058-90fac2d03679',
              name: 'Blue',
              description: 'description of level2',
              alias: 'Dark blue - Blue color Alias',
              order: 2,
            },
          ],
        },
        {
          name: 'Shape-updated',
          order: 2,
          levels: [
            {
              id: '11111111-1111-4a52-a058-90fac2d03679',
              name: 'Circle',
              order: 1,
            },
            {
              id: '22222222-2222-4a52-a058-90fac2d03679',
              name: 'Rectangle',
              description: 'description of level2',
              alias: 'Square - rectangle alias',
              order: 2,
            },
          ],
        },
      ],
    },
  ];

  const newExperimentDoc = { ...experiments[0], partitions: updatedPartitions };
  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        site: 'geometry',
        target: 'color and shape',
        order: 1,
        factors: expect.arrayContaining([
          expect.objectContaining({
            name: 'Color-updated',
            order: 1,
            levels: expect.arrayContaining([
              expect.objectContaining({
                id: '33333333-1111-4a52-a058-90fac2d03679',
                name: 'Red',
                order: 1,
              }),
              expect.objectContaining({
                id: '44444444-2222-4a52-a058-90fac2d03679',
                name: 'Blue',
                description: 'description of level2',
                alias: 'Dark blue - Blue color Alias',
                order: 2,
              }),
            ]),
          }),
          expect.objectContaining({
            name: 'Shape-updated',
            order: 2,
            levels: expect.arrayContaining([
              expect.objectContaining({
                id: '11111111-1111-4a52-a058-90fac2d03679',
                name: 'Circle',
                order: 1,
              }),
              expect.objectContaining({
                id: '22222222-2222-4a52-a058-90fac2d03679',
                name: 'Rectangle',
                description: 'description of level2',
                alias: 'Square - rectangle alias',
                order: 2,
              }),
            ]),
          }),
        ]),
      }),
    ])
  );
}
