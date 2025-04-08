import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { v4 as uuid } from 'uuid';
import SegmentServiceMock from './mocks/SegmentServiceMock';
import { SegmentService } from '../../../src/api/services/SegmentService';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';

describe('Segment Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    // set mock container
    Container.set(SegmentService, new SegmentServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  const segmentData = {
    id: uuid(),
    name: 'segment1',
    description: 'desc',
    context: 'home',
    type: 'public',
    status: 'Unused',
    userIds: ['user1'],
    groups: {
      groupId: 'group1',
      type: 'school',
    },
    subSegmentIds: ['seg2'],
  };

  const listInputData = {
    parentSegmentId: uuid(),
    name: 'list1',
    description: 'list description',
    context: 'home',
    type: 'private',
    userIds: ['user1', 'user2'],
    groups: [],
    subSegmentIds: [],
    listType: 'Individual',
  };

  test('Get request for /api/segments', () => {
    return request(app)
      .get('/api/segments')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/segments/:segmentId', () => {
    return request(app)
      .get(`/api/segments/${uuid()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/segments/status/:segmentId', () => {
    return request(app)
      .get(`/api/segments/status/${uuid()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/segments', () => {
    return request(app)
      .post('/api/segments')
      .send([segmentData])
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/segments/:segmentId', () => {
    return request(app).delete(`/api/segments/${uuid()}`).expect('Content-Type', /json/).expect(200);
  });

  test('Post request for /api/segments/import', () => {
    return request(app)
      .post('/api/segments/import')
      .send([segmentData])
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/segments/validation', () => {
    return request(app).post('/api/segments/validation').send(segmentData).expect('Content-Type', /json/).expect(200);
  });

  test('Get request for /api/segments/export/json', () => {
    return request(app)
      .get('/api/segments/export/json')
      .query({
        ids: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/segments/export/csv', () => {
    return request(app)
      .get('/api/segments/export/csv')
      .query({
        ids: [uuid()],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/segments/list (addSegmentList)', () => {
    return request(app)
      .post('/api/segments/list')
      .send(listInputData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/segments (updateSegmentList)', () => {
    const updateListData = {
      id: uuid(),
      name: 'updated list',
      description: 'updated description',
      context: 'home',
      type: 'private',
      userIds: ['user1', 'user2', 'user3'],
      groups: [],
      subSegmentIds: [],
      listType: 'Individual',
    };

    return request(app)
      .post('/api/segments')
      .send(updateListData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  // TODO: Should be uncommented once the backend endpoint is implemented
  // test('Delete request for /api/segments/list/:segmentId (deleteSegmentList)', () => {
  //   const segmentId = uuid();
  //   const parentSegmentId = uuid();

  //   return request(app)
  //     .delete(`/api/segments/list/${segmentId}`)
  //     .send({ parentSegmentId })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  // });
});
