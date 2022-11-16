import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';

describe('Version Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
  });

  afterAll(() => {
    Container.reset();
  });

  test('Get request for /api/version', async (done) => {
    await request(app).get('/api/version').set('Accept', 'application/json').expect('Content-Type', /json/).expect(200);
    done();
  });
});
