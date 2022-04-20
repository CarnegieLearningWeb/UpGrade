import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Segment, SegmentsPaginationParams } from './store/segments.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SegmentsDataService {
  constructor(private http: HttpClient) { }

  // fetchSegments(params: SegmentsPaginationParams) {
  //   const url = environment.api.getPaginatedSegments;
  //   return this.http.post(url, params);
  // }

  createNewSegment(segment: Segment) {
    const url = environment.api.segments;
    return this.http.post(url , segment);
  }

  // updateSegmentStatus(segmentId: string, status: boolean) {
  //   const url = environment.api.updateSegmentStatus;
  //   return this.http.post(url, { segmentId, status });
  // }

  deleteSegment(id: string) {
    const url = `${environment.api.segments}/${id}`;
    return this.http.delete(url);
  }

  updateSegment(segment: Segment) {
    const url = `${environment.api.segments}/${segment.id}`;
    return this.http.put(url, segment);
  }
}
