import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';

describe('Controller API routes', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
  });

  afterAll(() => {});

  test('Experiment Controller Testing', async done => {
    await request(app)
      .get('/api/experiments')
      .expect(200);
  });
});
