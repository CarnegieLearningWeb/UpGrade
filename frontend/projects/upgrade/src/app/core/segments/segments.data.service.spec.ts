import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SegmentsDataService } from './segments.data.service';
import {
  AddPrivateSegmentListRequest,
  EditPrivateSegmentListRequest,
  Segment,
  SegmentFile,
  SegmentInput,
} from './store/segments.model';
import { SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { Environment } from '../../../environments/environment-types';
import { FeatureFlagSegmentListDetails } from '../feature-flags/store/feature-flags.model';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('SegmentDataService', () => {
  let mockHttpClient: any;
  let service: SegmentsDataService;
  let mockSegmentInput: SegmentInput;
  let mockSegmentId: string;
  let mockEnvironment: Environment;
  let mockSegmentFile: SegmentFile;
  let mockAddPrivateSegmentListRequest: AddPrivateSegmentListRequest;
  let mockEditPrivateSegmentListRequest: EditPrivateSegmentListRequest;
  let mockParentSegmentId: string;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new SegmentsDataService(mockHttpClient as HttpClient, mockEnvironment);

    mockSegmentId = 'segmentId1';
    mockParentSegmentId = 'parentSegmentId1';
    mockSegmentInput = {
      createdAt: 'time',
      updatedAt: 'time',
      versionNumber: 0,
      id: 'segmentId1',
      name: 'segmentId1',
      context: 'any',
      description: 'segment testing',
      userIds: [],
      groups: [],
      subSegmentIds: [],
      type: SEGMENT_TYPE.PUBLIC,
    };
    const mockSegment: Segment = {
      createdAt: 'test',
      versionNumber: 0,
      updatedAt: 'test',
      id: 'abc123',
      name: 'abc',
      context: 'test',
      tags: [],
      description: 'test',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
      type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
      status: SEGMENT_STATUS.UNUSED,
    };
    mockSegmentFile = { fileName: 'test', fileContent: JSON.stringify(mockSegment) };

    mockAddPrivateSegmentListRequest = {
      id: mockParentSegmentId,
      enabled: true,
      listType: 'Individual',
      segment: {
        name: 'Test Segment List',
        description: 'Test description',
        context: 'test',
        type: SEGMENT_TYPE.PRIVATE,
        userIds: ['user1', 'user2'],
        groups: [],
        subSegmentIds: [],
      },
    };

    mockEditPrivateSegmentListRequest = {
      id: mockParentSegmentId,
      enabled: true,
      listType: 'Individual',
      segment: {
        id: mockSegmentId,
        name: 'Updated Segment List',
        description: 'Updated description',
        context: 'test',
        type: SEGMENT_TYPE.PRIVATE,
        userIds: ['user1', 'user2', 'user3'],
        groups: [],
        subSegmentIds: [],
      },
    };
  });

  describe('#fetchSegmentsPaginated', () => {
    it('should get the fetchSegmentsPaginated http observable', () => {
      const expectedUrl = mockEnvironment.api.segments;

      service.fetchAllSegments();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#createNewSegment', () => {
    it('should get the createNewSegment http observable', () => {
      const expectedUrl = mockEnvironment.api.segments;
      const segment = { ...mockSegmentInput };

      service.createNewSegment(segment);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { ...segment });
    });
  });

  describe('#deleteSegment', () => {
    it('should get the deleteSegment http observable', () => {
      const segmentId = mockSegmentId;
      const expectedUrl = `${mockEnvironment.api.segments}/${segmentId}`;

      service.deleteSegment(segmentId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#updateSegment', () => {
    it('should get the updateSegment http observable', () => {
      const segment = { ...mockSegmentInput };
      const expectedUrl = mockEnvironment.api.segments;

      service.updateSegment(segment);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { ...segment });
    });
  });

  describe('#exportSegments', () => {
    it('should post the exportSegments http observable', () => {
      const segmentIds = [mockSegmentId]; // Array of segment IDs
      const expectedUrl = mockEnvironment.api.exportSegments;

      let expectedParams = new HttpParams();
      segmentIds.forEach((id) => {
        expectedParams = expectedParams.append('ids', id.toString());
      });

      service.exportSegments(segmentIds);
      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl, { params: expectedParams });
    });
  });

  describe('#importSegments', () => {
    it('should get the importSegments http observable', () => {
      const mockUrl = mockEnvironment.api.importSegments;

      service.importSegments([mockSegmentFile]);

      expect(mockHttpClient.post).toHaveBeenCalledWith(mockUrl, [mockSegmentFile]);
    });
  });

  describe('#addSegmentList', () => {
    it('should post the addSegmentList http observable with transformed request', () => {
      const expectedUrl = mockEnvironment.api.addSegmentList;
      const mockSegment: Segment = {
        id: 'newSegmentId',
        name: 'New Segment',
        description: 'Test description',
        context: 'test',
        tags: [],
        type: SEGMENT_TYPE.PRIVATE,
        status: SEGMENT_STATUS.UNUSED,
        createdAt: 'test',
        updatedAt: 'test',
        versionNumber: 0,
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
      };

      const expectedOutput: FeatureFlagSegmentListDetails = {
        segment: mockSegment,
        featureFlag: null,
        enabled: mockAddPrivateSegmentListRequest.enabled,
        listType: mockAddPrivateSegmentListRequest.listType,
        parentSegmentId: mockAddPrivateSegmentListRequest.id,
      };

      // Setup mock response
      mockHttpClient.post.mockReturnValue(of(mockSegment));

      // Expected transformed request
      const expectedTransformedRequest = {
        parentSegmentId: mockAddPrivateSegmentListRequest.id,
        name: mockAddPrivateSegmentListRequest.segment.name,
        description: mockAddPrivateSegmentListRequest.segment.description,
        context: mockAddPrivateSegmentListRequest.segment.context,
        type: mockAddPrivateSegmentListRequest.segment.type,
        userIds: mockAddPrivateSegmentListRequest.segment.userIds,
        groups: mockAddPrivateSegmentListRequest.segment.groups,
        subSegmentIds: mockAddPrivateSegmentListRequest.segment.subSegmentIds,
        listType: mockAddPrivateSegmentListRequest.listType,
      };

      // Call the method and subscribe to result
      let result: FeatureFlagSegmentListDetails;
      service.addSegmentList(mockAddPrivateSegmentListRequest).subscribe((res) => {
        result = res;
      });

      // Verify HTTP call was made correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, expectedTransformedRequest);

      // Verify expected output transformation
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('#updateSegmentList', () => {
    it('should post the updateSegmentList http observable with transformed request', () => {
      const expectedUrl = mockEnvironment.api.segments;
      const mockSegment: Segment = {
        id: mockSegmentId,
        name: 'Updated Segment',
        description: 'Updated description',
        context: 'test',
        tags: [],
        type: SEGMENT_TYPE.PRIVATE,
        status: SEGMENT_STATUS.UNUSED,
        createdAt: 'test',
        updatedAt: 'test',
        versionNumber: 0,
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
      };

      const expectedOutput: FeatureFlagSegmentListDetails = {
        segment: mockSegment,
        featureFlag: null,
        enabled: mockEditPrivateSegmentListRequest.enabled,
        listType: mockEditPrivateSegmentListRequest.listType,
        parentSegmentId: mockEditPrivateSegmentListRequest.id,
      };

      // Setup mock response
      mockHttpClient.post.mockReturnValue(of(mockSegment));

      // Expected transformed request
      const expectedTransformedRequest = {
        id: mockEditPrivateSegmentListRequest.segment.id,
        name: mockEditPrivateSegmentListRequest.segment.name,
        description: mockEditPrivateSegmentListRequest.segment.description,
        context: mockEditPrivateSegmentListRequest.segment.context,
        type: mockEditPrivateSegmentListRequest.segment.type,
        userIds: mockEditPrivateSegmentListRequest.segment.userIds,
        groups: mockEditPrivateSegmentListRequest.segment.groups,
        subSegmentIds: mockEditPrivateSegmentListRequest.segment.subSegmentIds,
        listType: mockEditPrivateSegmentListRequest.listType,
      };

      // Call the method and subscribe to result
      let result: FeatureFlagSegmentListDetails;
      service.updateSegmentList(mockEditPrivateSegmentListRequest).subscribe((res) => {
        result = res;
      });

      // Verify HTTP call was made correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, expectedTransformedRequest);

      // Verify expected output transformation
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('#deleteSegmentList', () => {
    it('should delete the segment list with the correct parameters', () => {
      const segmentId = mockSegmentId;
      const parentSegmentId = mockParentSegmentId;
      const expectedUrl = `${mockEnvironment.api.addSegmentList}/${segmentId}`;

      service.deleteSegmentList(segmentId, parentSegmentId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl, { body: { parentSegmentId } });
    });
  });
});
