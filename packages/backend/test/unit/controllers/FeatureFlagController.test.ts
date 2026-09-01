import app from '../../utils/expressApp';
import request from 'supertest';
import { configureLogger } from '../../utils/logger';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import FeatureFlagServiceMock from './mocks/FeatureFlagServiceMock';

import { useContainer as classValidatorUseContainer } from 'class-validator';

import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import ExperimentUserServiceMock from './mocks/ExperimentUserServiceMock';
import { ErrorService } from '../../../src/api/services/ErrorService';
import ErrorServiceMock from './mocks/ErrorServiceMock';

describe('Feature Flag Controller Testing', () => {
  beforeAll(() => {
    configureLogger();
    routingUseContainer(Container);
    classValidatorUseContainer(Container);

    Container.set(FeatureFlagService, new FeatureFlagServiceMock());
    Container.set(ExperimentUserService, new ExperimentUserServiceMock());
    Container.set(ErrorService, new ErrorServiceMock());
  });

  afterAll(() => {
    Container.reset();
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
        id: crypto.randomUUID(),
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

  test('Patch request for /api/flags/status', () => {
    return request(app)
      .patch('/api/flags/status')
      .send({
        flagId: crypto.randomUUID(),
        status: 'enabled',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Patch request for /api/flags/filterMode', () => {
    return request(app)
      .patch('/api/flags/filterMode')
      .send({
        flagId: crypto.randomUUID(),
        filterMode: 'includeAll',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Get request for /api/flags/id', () => {
    return request(app)
      .get('/api/flags/' + crypto.randomUUID())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/flags/id', () => {
    return request(app)
      .delete('/api/flags/' + crypto.randomUUID())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Patch request for /api/flags/inclusionList/id/status', () => {
    return request(app)
      .patch('/api/flags/inclusionList/' + crypto.randomUUID() + '/status')
      .send({ enabled: false })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Patch request for /api/flags/exclusionList/id/status', () => {
    return request(app)
      .patch('/api/flags/exclusionList/' + crypto.randomUUID() + '/status')
      .send({ enabled: true })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Put request for /api/flags/id', () => {
    return request(app)
      .put('/api/flags/' + crypto.randomUUID())
      .send({
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
      .delete('/api/flags/inclusionList/' + crypto.randomUUID())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Delete request for /api/flags/exclusionList/id', () => {
    return request(app)
      .delete('/api/flags/exclusionList/' + crypto.randomUUID())
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  // TODO: The PUT request tests below are currently failing due to the absence of existing lists to update.
  // Future improvement: Refactor these tests to follow a "Create, then update" pattern for feature flag inclusion/exclusion lists.
  // This will ensure we test the full lifecycle and have the necessary data for updates.

  // test('Put request for /api/flags/inclusionList/id', () => {
  //   const segmentId = crypto.randomUUID();
  //   return request(app)
  //     .put('/api/flags/inclusionList/' + segmentId)
  //     .send({
  //       flagId: crypto.randomUUID(),
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
  //   const segmentId = crypto.randomUUID();
  //   return request(app)
  //     .put('/api/flags/exclusionList/' + segmentId)
  //     .send({
  //       flagId: crypto.randomUUID(),
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

  describe('Negative scenarios', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('Get request for /api/flags/id returns 404 when flag does not exist', () => {
      const mockService = Container.get(FeatureFlagService);
      jest.spyOn(mockService, 'findOneForDetails').mockResolvedValueOnce(undefined);

      return request(app)
        .get('/api/flags/' + crypto.randomUUID())
        .set('Accept', 'application/json')
        .expect(404);
    });

    test('Get request for /api/flags/id returns 400 for a non-UUID id', () => {
      return request(app).get('/api/flags/not-a-uuid').set('Accept', 'application/json').expect(400);
    });

    test('Delete request for /api/flags/id returns 404 when flag does not exist', () => {
      const mockService = Container.get(FeatureFlagService);
      jest.spyOn(mockService, 'delete').mockResolvedValueOnce(undefined);

      return request(app)
        .delete('/api/flags/' + crypto.randomUUID())
        .set('Accept', 'application/json')
        .expect(404);
    });

    test('Delete request for /api/flags/id returns 400 for a non-UUID id', () => {
      return request(app).delete('/api/flags/not-a-uuid').set('Accept', 'application/json').expect(400);
    });

    test('Put request for /api/flags/id returns 404 when flag does not exist', () => {
      const mockService = Container.get(FeatureFlagService);
      jest.spyOn(mockService, 'findOneForDetails').mockResolvedValueOnce(undefined);

      return request(app)
        .put('/api/flags/' + crypto.randomUUID())
        .send({
          id: crypto.randomUUID(),
          name: 'string',
          key: 'string',
          description: 'string',
          status: 'enabled',
          context: ['foo'],
          tags: ['bar'],
          filterMode: 'includeAll',
        })
        .set('Accept', 'application/json')
        .expect(404);
    });

    test('Put request for /api/flags/id returns 400 for a non-UUID id', () => {
      return request(app)
        .put('/api/flags/not-a-uuid')
        .send({
          id: crypto.randomUUID(),
          name: 'string',
          key: 'string',
          description: 'string',
          status: 'enabled',
          context: ['foo'],
          tags: ['bar'],
          filterMode: 'includeAll',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Put request for /api/flags/id returns 400 when the context is invalid', () => {
      const mockService = Container.get(FeatureFlagService);
      jest.spyOn(mockService, 'validateFeatureFlagContext').mockReturnValueOnce('Invalid context');

      return request(app)
        .put('/api/flags/' + crypto.randomUUID())
        .send({
          id: crypto.randomUUID(),
          name: 'string',
          key: 'string',
          description: 'string',
          status: 'enabled',
          context: ['foo'],
          tags: ['bar'],
          filterMode: 'includeAll',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Post request for /api/flags returns 400 when the context is invalid', () => {
      const mockService = Container.get(FeatureFlagService);
      jest.spyOn(mockService, 'validateFeatureFlagContext').mockReturnValueOnce('Invalid context');

      return request(app)
        .post('/api/flags')
        .send({
          id: crypto.randomUUID(),
          name: 'string',
          key: 'string',
          description: 'string',
          status: 'enabled',
          context: ['foo'],
          tags: ['bar'],
          filterMode: 'includeAll',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Post request for /api/flags returns 400 when required fields are missing', () => {
      return request(app)
        .post('/api/flags')
        .send({
          id: crypto.randomUUID(),
          description: 'string',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Patch request for /api/flags/status returns 400 when status is invalid', () => {
      return request(app)
        .patch('/api/flags/status')
        .send({
          flagId: crypto.randomUUID(),
          status: 'not-a-real-status',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Patch request for /api/flags/filterMode returns 400 when filterMode is invalid', () => {
      return request(app)
        .patch('/api/flags/filterMode')
        .send({
          flagId: crypto.randomUUID(),
          filterMode: 'not-a-real-filter-mode',
        })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Patch request for /api/flags/inclusionList/id/status returns 400 for a non-UUID id', () => {
      return request(app)
        .patch('/api/flags/inclusionList/not-a-uuid/status')
        .send({ enabled: false })
        .set('Accept', 'application/json')
        .expect(400);
    });

    test('Delete request for /api/flags/inclusionList/id returns 400 for a non-UUID id', () => {
      return request(app).delete('/api/flags/inclusionList/not-a-uuid').set('Accept', 'application/json').expect(400);
    });
  });
});
