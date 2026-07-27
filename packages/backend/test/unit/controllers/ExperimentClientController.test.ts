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
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { validate } from 'class-validator';
import { ExperimentClientController } from '../../../src/api/controllers/ExperimentClientController.v6';
import { ExperimentAssignmentValidatorv6 } from '../../../src/api/controllers/validators/ExperimentAssignmentValidator';
import ExperimentServiceMock from './mocks/ExperimentServiceMock';
import ExperimentAssignmentServiceMock from './mocks/ExperimentAssignmentServiceMock';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';
import MetricServiceMock from './mocks/MetricServiceMock';
import ClientLibMiddlewareMock from './mocks/ClientLibMiddlewareMock';
import MockuserCheckMiddleware from './mocks/UserCheckMiddlewareMock';

describe('Experiment Client Controller Testing', () => {
  const experimentServiceMock = new ExperimentServiceMock();
  const experimentAssignmentServiceMock = new ExperimentAssignmentServiceMock();
  const experimentUserServiceMock = new ExperimentUserServiceMock();
  const featureFlagServiceMock = new FeatureFlagServiceMock();
  const metricServiceMock = new MetricServiceMock();
  const clientLibMiddlewareMock = new ClientLibMiddlewareMock();
  const userCheckMiddlewareMock = new MockuserCheckMiddleware();
  const controller = new ExperimentClientController(
    experimentServiceMock as any,
    experimentAssignmentServiceMock as any,
    experimentUserServiceMock as any,
    featureFlagServiceMock as any,
    metricServiceMock as any,
    {} as any
  );
  const mockRequest = {
    logger: {
      info: jest.fn(),
    },
    userDoc: {
      id: 'u21',
    },
  } as any;

  beforeAll(() => {
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentService, experimentServiceMock);
    Container.set(ExperimentAssignmentService, experimentAssignmentServiceMock);
    Container.set(ExperimentUserService, experimentUserServiceMock);
    Container.set(FeatureFlagService, featureFlagServiceMock);
    Container.set(MetricService, metricServiceMock);
    Container.set(ClientLibMiddleware, clientLibMiddlewareMock);
    Container.set(UserCheckMiddleware, userCheckMiddlewareMock);
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

  test('Post request for /api/v5/init', async () => {
    const response = await request(app)
      .post('/api/v5/init')
      .send({
        id: '123',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/groupmembership', async () => {
    const response = await request(app)
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

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/workinggroup', async () => {
    const response = await request(app)
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

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/mark', async () => {
    const response = await request(app)
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

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/mark with null target', async () => {
    const response = await request(app)
      .post('/api/v5/mark')
      .send({
        userId: 'u21',
        status: 'condition applied',
        data: {
          target: null,
          site: 'q',
          assignedCondition: {
            conditionCode: 'condition',
          },
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/mark with missing target', async () => {
    const response = await request(app)
      .post('/api/v5/mark')
      .send({
        userId: 'u21',
        status: 'condition applied',
        data: {
          site: 'q',
          assignedCondition: {
            conditionCode: 'condition',
          },
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/assign', async () => {
    const response = await request(app)
      .post('/api/v5/assign')
      .send({
        userId: 'u21',
        context: 'abc',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/log', async () => {
    const response = await request(app)
      .post('/api/v5/log')
      .send(logData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  test('Post request for /api/v5/useraliases', async () => {
    const response = await request(app)
      .patch('/api/v5/useraliases')
      .send({
        userId: 'u21',
        aliases: ['abc'],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.status).toBe(200);
  });

  describe('Post request for /api/v6/assign', () => {
    test('rejects target without site', async () => {
      const validator = Object.assign(new ExperimentAssignmentValidatorv6(), {
        context: 'abc',
        target: 'W1',
      });

      const errors = await validate(validator);

      expect(errors.some((error) => error.property === 'target')).toBe(true);
    });

    test('rejects null target without site', async () => {
      const validator = Object.assign(new ExperimentAssignmentValidatorv6(), {
        context: 'abc',
        target: null,
      });

      const errors = await validate(validator);

      expect(errors.some((error) => error.property === 'target')).toBe(true);
    });

    test('normalizes missing target to an empty string when site is provided', async () => {
      const getAllExperimentConditionsSpy = jest
        .spyOn(experimentAssignmentServiceMock as any, 'getAllExperimentConditions')
        .mockResolvedValue([]);

      const response = await controller.getAllExperimentConditions(
        mockRequest,
        Object.assign(new ExperimentAssignmentValidatorv6(), {
          context: 'abc',
          site: 'CurriculumSequence',
        })
      );

      expect(response).toEqual([]);
      expect(getAllExperimentConditionsSpy).toHaveBeenCalledTimes(1);
      expect(getAllExperimentConditionsSpy).toHaveBeenCalledWith(
        mockRequest.userDoc,
        'abc',
        'CurriculumSequence',
        '',
        mockRequest.logger
      );

      getAllExperimentConditionsSpy.mockRestore();
    });
  });
});
