import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import uuid from 'uuid';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import PreviewUserServiceMock from './mocks/PreviewUserServiceMock';

describe('Preview User Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(PreviewUserService, new PreviewUserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/previewusers/paginated', async (done) => {
    await request(app)
      .post('/api/previewusers/paginated')
      .send({
        skip: 0,
        take: 0,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/previewusers/:id', async (done) => {
    await request(app)
      .get(`/api/previewusers/${uuid()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Get request for /api/previewusers/:id user not found', async (done) => {
    await request(app)
      .get(`/api/previewusers/`)
      .set('Accept', 'application/json')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(404);
    done();
  });

  test('Post request for /api/previewusers', async (done) => {
    await request(app)
      .post(`/api/previewusers`)
      .send({
        id: 'string',
        assignments: [
          {
            id: 'string',
            experiment: {
              id: 'string',
            },
            experimentCondition: {
              id: 'string',
            },
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Put request for /api/previewusers/:id', async (done) => {
    await request(app)
      .put(`/api/previewusers/${uuid()}`)
      .send({
        id: 'string',
        assignments: [
          {
            id: 'string',
            experiment: {
              id: 'string',
            },
            experimentCondition: {
              id: 'string',
            },
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Delete request for /api/previewusers/:id', async (done) => {
    await request(app)
      .delete(`/api/previewusers/${uuid()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });

  test('Post request for /api/previewusers/assign', async (done) => {
    await request(app)
      .post(`/api/previewusers/assign`)
      .send({
        id: 'string',
        assignments: [
          {
            id: 'string',
            experiment: {
              id: 'string',
            },
            experimentCondition: {
              id: 'string',
            },
          },
        ],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    done();
  });
});
