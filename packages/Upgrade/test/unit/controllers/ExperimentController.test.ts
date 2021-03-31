import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import MockExperimentController from './mocks/MockService';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';

describe('Experiment Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(ExperimentService, new MockExperimentController());
    Container.set(ExperimentAssignmentService, new MockExperimentController());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/experiments', async done => {
    // creating express app here
    await request(app)
      .get('/api/experiments')
      .expect('Content-Type', /json/)
      .expect(200);

    done();
  });
});
