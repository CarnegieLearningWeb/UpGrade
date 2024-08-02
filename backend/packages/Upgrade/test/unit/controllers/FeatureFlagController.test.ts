import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';

describe('Feature Flag Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    ormUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(FeatureFlagService, new FeatureFlagServiceMock());
    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
  });

  afterAll(() => {
    Container.reset();
  });

  test('Post request for /api/flags/keys', () => {
    return request(app)
      .post('/api/flags/keys')
      .send({
        userId: 'user',
        context: 'context',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/flags/paginated', () => {
    return request(app)
      .post('/api/flags/paginated')
      .send({
        skip: 0,
        take: 20,
        sortParams: {
          key: 'name',
          sortAs: 'ASC',
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/flags', () => {
    return request(app)
      .post('/api/flags')
      .send({
        id: 'string',
        name: 'string',
        key: 'string',
        description: 'string',
        status: 'enabled',
        context: ['foo'],
        tags: ['bar'],
        filterMode: 'includeAll',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/flags/status', () => {
    return request(app)
      .post('/api/flags/status')
      .send({
        flagId: uuid(),
        status: 'enabled',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/flags/id', () => {
    return request(app)
      .delete('/api/flags/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Put request for /api/flags/id', () => {
    return request(app)
      .put('/api/flags/' + uuid())
      .send({
        id: 'string',
        name: 'string',
        key: 'string',
        description: 'string',
        status: 'enabled',
        context: ['foo'],
        tags: ['bar'],
        filterMode: 'includeAll',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/flags/inclusionList', () => {
    return request(app)
      .post('/api/flags/inclusionList')
      .send({
        flagId: uuid(),
        enabled: true,
        listType: 'string',
        list: {
          name: 'string',
          context: 'string',
          type: 'private',
          userIds: ['string'],
          groups: [],
          subSegmentIds: [],
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Post request for /api/flags/exclusionList', () => {
    return request(app)
      .post('/api/flags/exclusionList')
      .send({
        flagId: uuid(),
        enabled: true,
        listType: 'string',
        list: {
          name: 'string',
          context: 'string',
          type: 'private',
          userIds: ['string'],
          groups: [],
          subSegmentIds: [],
        },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/flags/inclusionList/id', () => {
    return request(app)
      .delete('/api/flags/inclusionList/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/flags/exclusionList/id', () => {
    return request(app)
      .delete('/api/flags/exclusionList/' + uuid())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  // TODO: The PUT request tests below are currently failing due to the absence of existing lists to update.
  // Future improvement: Refactor these tests to follow a "Create, then update" pattern for feature flag inclusion/exclusion lists.
  // This will ensure we test the full lifecycle and have the necessary data for updates.

  // test('Put request for /api/flags/inclusionList/id', () => {
  //   const segmentId = uuid();
  //   return request(app)
  //     .put('/api/flags/inclusionList/' + segmentId)
  //     .send({
  //       flagId: uuid(),
  //       enabled: true,
  //       listType: 'string',
  //       list: {
  //         id: segmentId,
  //         name: 'string',
  //         context: 'string',
  //         type: 'private',
  //         userIds: ['string'],
  //         groups: [],
  //         subSegmentIds: [],
  //       },
  //     })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  // });

  // test('Put request for /api/flags/exclusionList/id', () => {
  //   const segmentId = uuid();
  //   return request(app)
  //     .put('/api/flags/exclusionList/' + segmentId)
  //     .send({
  //       flagId: uuid(),
  //       enabled: true,
  //       listType: 'string',
  //       list: {
  //         id: segmentId,
  //         name: 'string',
  //         context: 'string',
  //         type: 'private',
  //         userIds: ['string'],
  //         groups: [],
  //         subSegmentIds: [],
  //       },
  //     })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  // });
});
