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

  // sort factors
  experiments[0].factors.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));

  experiments[0].factors.forEach((factor) => {
    factor.levels.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  });

  expect(experiments[0].factors).toEqual(
    expect.arrayContaining([
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
            payload: {
              type: 'string',
              value: 'Dark blue - Blue color Alias',
            },
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
            payload: {
              type: 'string',
              value: 'Square - rectangle alias',
            },
            order: 2,
          }),
        ]),
      }),
    ])
  );

  const updatedFactors = [
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
          payload: {
            type: 'string',
            value: 'Dark blue - Blue color Alias',
          },
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
          payload: {
            type: 'string',
            value: 'Square - rectangle alias',
          },
          order: 2,
        },
      ],
    },
  ];

  const newExperimentDoc = { ...experiments[0], factors: updatedFactors };
  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.factors).toEqual(
    expect.arrayContaining([
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
            payload: {
              type: 'string',
              value: 'Dark blue - Blue color Alias',
            },
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
            payload: {
              type: 'string',
              value: 'Square - rectangle alias',
            },
            order: 2,
          }),
        ]),
      }),
    ])
  );
}
