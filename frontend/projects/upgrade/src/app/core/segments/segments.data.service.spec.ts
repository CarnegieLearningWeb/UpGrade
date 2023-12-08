import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SegmentsDataService } from './segments.data.service';
import { SegmentInput } from './store/segments.model';
import { SEGMENT_TYPE } from 'upgrade_types';
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
  let mockSegment: SegmentInput;
  let mockSegmentId: string;
  let mockEnvironment: Environment;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new SegmentsDataService(mockHttpClient as HttpClient, mockEnvironment);

    mockSegmentId = 'segmentId1';
    mockSegment = {
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
      const segment = { ...mockSegment };

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
      const segment = { ...mockSegment };
      const expectedUrl = mockEnvironment.api.segments;

      service.updateSegment(segment);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { ...segment });
    });
  });

  describe('#exportSegments', () => {
    it('should post the exportSegments http observable', () => {
      const segmentId = mockSegmentId;
      const expectedUrl = `${mockEnvironment.api.exportSegments}`;

      service.exportSegments([segmentId]);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, [segmentId]);
    });
  });

  describe('#importSegments', () => {
    it('should get the importSegments http observable', () => {
      const mockUrl = mockEnvironment.api.importSegments;
      const segment = { ...mockSegment };

      service.importSegments([segment]);

      expect(mockHttpClient.post).toHaveBeenCalledWith(mockUrl, [segment]);
    });
  });
});
