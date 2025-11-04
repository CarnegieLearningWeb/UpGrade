import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import ExperimentAssignmentServiceMock from './mocks/ExperimentAssignmentServiceMock';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';
import { v4 as uuid } from 'uuid';
import { DataSource } from 'typeorm';
import { Container as TypeDIContainer } from '../../../src/typeorm-typedi-extensions';

describe('BatchAssign Controller Testing', () => {
  let dataSource: DataSource;

  beforeAll(() => {
    configureLogger();

    // Create a mock DataSource
    dataSource = new DataSource({
      type: 'postgres',
      database: 'test',
      entities: [],
      synchronize: false,
    });

    // Set up the DataSource in the TypeDI Container
    TypeDIContainer.setDataSource('default', dataSource);

    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(ExperimentAssignmentService, new ExperimentAssignmentServiceMock());
    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
  });

  afterAll(() => {
    Container.reset();
    // Clean up the DataSource
    if (dataSource) {
      TypeDIContainer.getDataSource('default')
        ?.destroy()
        .catch((error) => {
          console.error('Error destroying DataSource:', error);
        });
    }
  });

  test('Post request for /api/batch-assign with valid batch assignment request', () => {
    const userId1 = uuid();
    const userId2 = uuid();

    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds: [userId1, userId2],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/batch-assign with single user', () => {
    const userId = uuid();

    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds: [userId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/batch-assign with multiple users', () => {
    const userIds = [uuid(), uuid(), uuid(), uuid()];

    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'assign-prog',
        site: 'CurriculumSequence',
        target: 'sequence1',
        userIds,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/batch-assign with different context values', () => {
    const userId = uuid();

    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'instructor-dashboard',
        site: 'Dashboard',
        target: 'analytics',
        userIds: [userId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/batch-assign with empty userIds array', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds: [],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/batch-assign with large batch of users', () => {
    const userIds = Array.from({ length: 50 }, () => uuid());

    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  // Validation Error Tests - Should return 400
  test('Post request for /api/batch-assign with missing context', async () => {
    const response = await request(app)
      .post('/api/batch-assign')
      .send({
        site: 'SelectSection',
        target: 'Site1',
        userIds: [],
      })
      .set('Accept', 'application/json');

    console.log('Status:', response.status);
    console.log('Body:', response.body);
    console.log('Text:', response.text);

    expect(response.status).toBe(400);
  });

  test('Post request for /api/batch-assign with empty context string', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: '',
        site: 'SelectSection',
        target: 'Site1',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with missing site', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        target: 'Site1',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with empty site string', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: '',
        target: 'Site1',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with missing target', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with empty target string', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: '',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with missing userIds', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with null context', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: null,
        site: 'SelectSection',
        target: 'Site1',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with null userIds', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds: null,
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with non-string context', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 123,
        site: 'SelectSection',
        target: 'Site1',
        userIds: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with non-string elements in userIds array', () => {
    return request(app)
      .post('/api/batch-assign')
      .send({
        context: 'home',
        site: 'SelectSection',
        target: 'Site1',
        userIds: [uuid(), 123, uuid()],
      })
      .set('Accept', 'application/json')
      .expect(400);
  });

  test('Post request for /api/batch-assign with empty object', () => {
    return request(app).post('/api/batch-assign').send({}).set('Accept', 'application/json').expect(400);
  });
});
