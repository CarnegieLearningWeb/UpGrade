import app from '../../utils/expressApp';
import request from 'supertest';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { MetricService } from '../../../src/api/services/MetricService';
import { ClientLibMiddleware } from '../../../src/api/middlewares/ClientLibMiddleware';
import { UserCheckMiddleware } from '../../../src/api/middlewares/UserCheckMiddleware';
import ExperimentServiceMock from './mocks/ExperimentServiceMock';
import ExperimentAssignmentServiceMock from './mocks/ExperimentAssignmentServiceMock';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';
import MetricServiceMock from './mocks/MetricServiceMock';
import ClientLibMiddlewareMock from './mocks/ClientLibMiddlewareMock';
import MockuserCheckMiddleware from './mocks/UserCheckMiddlewareMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';
// import { v4 as uuid } from 'uuid';

describe('Experiment Client Controller Testing', () => {
  beforeAll(() => {
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentService, new ExperimentServiceMock());
    Container.set(ExperimentAssignmentService, new ExperimentAssignmentServiceMock());
    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
    Container.set(FeatureFlagService, new FeatureFlagServiceMock());
    Container.set(MetricService, new MetricServiceMock());
    Container.set(ClientLibMiddleware, new ClientLibMiddlewareMock());
    Container.set(UserCheckMiddleware, new MockuserCheckMiddleware());
  });

  afterAll(() => {
    Container.reset();
  });

  const logData = {
    userId: 'u22',
    value: [
      {
        timestamp: '1970-01-01T00:00:00Z',
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'masteryWorkspace',
              groupKey: 'calculating_area_of_square',
              groupUniquifier: '1990-10-10T00:00:00Z',
              attributes: {
                hintCount: 31,
              },
            },
          ],
        },
      },
    ],
  };

  test('Post request for /api/v5/init', () => {
    return request(app)
      .post('/api/v5/init')
      .send({
        id: '123',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/groupmembership', () => {
    return request(app)
      .patch('/api/v5/groupmembership')
      .send({
        id: 'u21',
        group: {
          class: ['C1', 'C2'],
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/workinggroup', () => {
    return request(app)
      .patch('/api/v5/workinggroup')
      .send({
        id: 'u21',
        workingGroup: {
          school: 'testschool',
          class: 'testclass',
          instructor: 'testteacher',
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/mark', () => {
    return request(app)
      .post('/api/v5/mark')
      .send({
        userId: 'u21',
        status: 'condition applied',
        data: {
          target: 'p',
          site: 'q',
          assignedCondition: {
            conditionCode: 'condition',
          },
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/assign', () => {
    return request(app)
      .post('/api/v5/assign')
      .send({
        userId: 'u21',
        context: 'abc',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/log', () => {
    return request(app)
      .post('/api/v5/log')
      .send(logData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/v5/useraliases', () => {
    return request(app)
      .patch('/api/v5/useraliases')
      .send({
        userId: 'u21',
        aliases: ['abc'],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
