import app from '../../utils/expressApp';
import { Container } from 'typedi';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import request from 'supertest';
import uuid from 'uuid/v4';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import ScheduledJobServiceMock from './mocks/ScheduledJobServiceMock';

describe('Scheduled Job Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);

    // set mock container
    Container.set(ScheduledJobService, new ScheduledJobServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/scheduledJobs/start', async done => {
    // creating express app here
    await request(app)
      .post('/api/scheduledJobs/start')
      .send({ id: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    done();
  });

  test('Post request for /api/scheduledJobs/end', async done => {
    // creating express app here
    await request(app)
      .post('/api/scheduledJobs/end')
      .send({ id: uuid() })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    done();
  });
});
