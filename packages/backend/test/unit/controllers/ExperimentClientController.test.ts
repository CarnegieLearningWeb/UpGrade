import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { Exclude, instanceToPlain } from 'class-transformer';
import { DataSource } from 'typeorm';
import { Container as TypeDIContainer } from '../../../src/typeorm-typedi-extensions';

import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { MetricService } from '../../../src/api/services/MetricService';
import { SettingService } from '../../../src/api/services/SettingService';
import { ThompsonSamplingRewardService } from '../../../src/api/services/ThompsonSamplingRewardService';
import ExperimentAssignmentServiceMock from './mocks/ExperimentAssignmentServiceMock';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';
import ExperimentServiceMock from './mocks/ExperimentServiceMock';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';
import MetricServiceMock from './mocks/MetricServiceMock';
import SettingServiceMock from './mocks/SettingServiceMock';

/**
 * A response value that class-transformer would change: instanceToPlain drops `excludedField`, while a plain
 * JSON.stringify keeps it. So if `excludedField` reaches the client, the response skipped class-transformer.
 */
class ClassTransformerMarker {
  public includedField = 'always serialized';

  @Exclude()
  public excludedField = 'only serialized when class-transformer is skipped';
}

describe('Experiment Client Controller (v6) Testing', () => {
  let dataSource: DataSource;
  const experimentAssignmentService = new ExperimentAssignmentServiceMock() as any;
  const experimentUserService = new ExperimentUserServiceMock() as any;
  const featureFlagService = new FeatureFlagServiceMock() as any;
  const thompsonSamplingRewardService: any = { acceptReward: () => undefined };

  beforeAll(() => {
    configureLogger();

    dataSource = new DataSource({ type: 'postgres', database: 'test', entities: [], synchronize: false });
    TypeDIContainer.setDataSource('default', dataSource);

    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentAssignmentService, experimentAssignmentService);
    Container.set(ExperimentUserService, experimentUserService);
    Container.set(ExperimentService, new ExperimentServiceMock());
    Container.set(FeatureFlagService, featureFlagService);
    Container.set(MetricService, new MetricServiceMock());
    Container.set(SettingService, new SettingServiceMock());
    Container.set(ThompsonSamplingRewardService, thompsonSamplingRewardService);
  });

  afterAll(() => {
    Container.reset();
    TypeDIContainer.getDataSource('default')
      ?.destroy()
      .catch((error) => {
        console.error('Error destroying DataSource:', error);
      });
  });

  describe('responses skip the class-transformer pass', () => {
    it('uses a marker that class-transformer would change', () => {
      // Guards the tests below: if this stopped holding, they would pass whether or not the transform ran.
      expect(instanceToPlain(new ClassTransformerMarker())).toEqual({ includedField: 'always serialized' });
    });

    const expectUntransformed = (body: unknown) => {
      expect(body).toEqual(JSON.parse(JSON.stringify(new ClassTransformerMarker())));
    };

    it('POST /v6/assign', async () => {
      experimentAssignmentService.getAllExperimentConditions = () => Promise.resolve([new ClassTransformerMarker()]);
      // The handler passes the result through formatAssignments; let it through unchanged so the marker reaches
      // the response pass.
      experimentAssignmentService.formatAssignments = (assignments: unknown[]) => assignments;

      const response = await request(app)
        .post('/api/v6/assign')
        .set('User-Id', 'user-1')
        .send({ context: 'home' })
        .expect('Content-Type', /json/)
        .expect(200);

      expectUntransformed(response.body[0]);
    });

    it('POST /v6/featureflag', async () => {
      featureFlagService.getKeys = () => Promise.resolve([new ClassTransformerMarker()]);

      const response = await request(app)
        .post('/api/v6/featureflag')
        .set('User-Id', 'user-1')
        .send({ context: 'home' })
        .expect('Content-Type', /json/)
        .expect(200);

      expectUntransformed(response.body[0]);
    });

    it('PATCH /v6/useraliases', async () => {
      experimentUserService.setAliasesForUser = () => Promise.resolve(new ClassTransformerMarker());

      const response = await request(app)
        .patch('/api/v6/useraliases')
        .set('User-Id', 'user-1')
        .send({ aliases: ['alias-1'] })
        .expect('Content-Type', /json/)
        .expect(200);

      expectUntransformed(response.body);
    });

    it('POST /v6/reward', async () => {
      thompsonSamplingRewardService.acceptReward = () => Promise.resolve(new ClassTransformerMarker());

      const response = await request(app)
        .post('/api/v6/reward')
        .set('User-Id', 'user-1')
        .send({ rewardValue: 'SUCCESS', experimentId: 'experiment-1' })
        .expect('Content-Type', /json/)
        .expect(200);

      expectUntransformed(response.body);
    });
  });

  describe('request bodies are still validated', () => {
    it('rejects POST /v6/assign without a context', async () => {
      let called = false;
      experimentAssignmentService.getAllExperimentConditions = () => {
        called = true;
        return Promise.resolve([]);
      };

      const response = await request(app).post('/api/v6/assign').set('User-Id', 'user-1').send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      expect(called).toBe(false);
    });
  });
});
