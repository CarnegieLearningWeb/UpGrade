import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { QueryService } from '../../../src/api/services/QueryService';
import QueryServiceMock from './mocks/QueryServiceMock';

describe('Query Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(QueryService, new QueryServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/query/analyse', () => {
    return request(app)
      .post('/api/query/analyse')
      .send({
        queryIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
