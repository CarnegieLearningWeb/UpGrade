import { Inject, Injectable } from '@angular/core';
import { SegmentInput } from './store/segments.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class SegmentsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchSegments() {
    const url = this.environment.api.segments;
    return this.http.get(url);
  }

  createNewSegment(segment: SegmentInput) {
    const url = this.environment.api.segments;
    return this.http.post(url, segment);
  }

  deleteSegment(id: string) {
    const url = `${this.environment.api.segments}/${id}`;
    return this.http.delete(url);
  }

  updateSegment(segment: SegmentInput) {
    const url = this.environment.api.segments;
    return this.http.post(url, segment);
  }

  exportSegments(segmentIds: string[]) {
    let ids = new HttpParams();
    segmentIds.forEach((id) => {
      ids = ids.append('ids', id.toString());
    });

    const url = this.environment.api.exportSegments;
    return this.http.get(url, { params: ids });
  }

  importSegments(segments: SegmentInput[]) {
    const url = this.environment.api.importSegments;
    return this.http.post(url, segments);
  }
}
