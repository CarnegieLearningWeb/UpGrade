import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import { SettingService } from '../../../src/api/services/SettingService';
import SettingServiceMock from './mocks/SettingServiceMock';

describe('Setting Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(SettingService, new SettingServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/setting', () => {
    return request(app)
      .get('/api/setting')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/setting', () => {
    return request(app)
      .post('/api/setting')
      .send({
        toCheckAuth: true,
        toFilterMetric: true,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
