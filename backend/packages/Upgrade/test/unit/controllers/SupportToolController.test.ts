import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import uuid from 'uuid/v4';
import { SupportService } from '../../../src/api/services/SupportService';
import SupportServiceMock from './mocks/SupportServiceMock';

describe('Support Tool Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(SupportService, new SupportServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/support/assignment', async done => {
    await request(app)
      .post('/api/support/assignment')
      .send({
        userId: uuid(),
        context: "context"
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

});
