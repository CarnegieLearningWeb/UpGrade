import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { CheckService } from '../../../src/api/services/CheckService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import CheckServiceMock from './mocks/CheckServiceMock';

describe('Check Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(CheckService, new CheckServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/check/groupAssignment', () => {
    return request(app).get('/api/check/groupAssignment').expect('Content-Type', /json/).expect(200);
  });

  test('Get request for /api/check/individualAssignment', () => {
    return request(app).get('/api/check/individualAssignment').expect('Content-Type', /json/).expect(200);
  });

  test('Get request for /api/check/individualExclusion', () => {
    return request(app).get('/api/check/individualExclusion').expect('Content-Type', /json/).expect(200);
  });

  test('Get request for /api/check/groupExclusion', () => {
    return request(app).get('/api/check/groupExclusion').expect('Content-Type', /json/).expect(200);
  });

  test('Get request for /api/check/monitoredExperimentPoint', () => {
    return request(app).get('/api/check/monitoredExperimentPoint').expect('Content-Type', /json/).expect(200);
  });
});
