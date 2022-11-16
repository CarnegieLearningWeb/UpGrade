import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { AuditService } from '../../../src/api/services/AuditService';
import { ErrorService } from '../../../src/api/services/ErrorService';
import ErrorServiceMock from './mocks/ErrorServiceMock';
import AuditServiceMock from './mocks/AuditServiceMock';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Log Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(AuditService, new AuditServiceMock());
    Container.set(ErrorService, new ErrorServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/audit', async (done) => {
    await request(app)
      .post('/api/audit')
      .send({
        skip: 0,
        take: 0,
        filter: 'experimentCreated',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/error', async (done) => {
    await request(app)
      .post('/api/error')
      .send({
        skip: 0,
        take: 0,
        filter: 'Database not reachable',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
