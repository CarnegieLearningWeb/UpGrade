import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SegmentsDataService } from './segments.data.service';
import { Segment, SegmentFile, SegmentInput } from './store/segments.model';
import { SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { Environment } from '../../../environments/environment-types';

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

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new SegmentsDataService(mockHttpClient as HttpClient, mockEnvironment);

    mockSegmentId = 'segmentId1';
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
  });

  describe('#fetchSegments', () => {
    it('should get the fetchSegments http observable', () => {
      const expectedUrl = mockEnvironment.api.segments;

      service.fetchSegments();

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
});
