import { Inject, Injectable } from '@angular/core';
import { SegmentFile_LEGACY, SegmentInput_LEGACY } from './store/segments.model._LEGACY';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class SegmentsDataService_LEGACY {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchSegments() {
    const url = this.environment.api.segments;
    return this.http.get(url);
  }

  createNewSegment(segment: SegmentInput_LEGACY) {
    const url = this.environment.api.segments;
    return this.http.post(url, segment);
  }

  getSegmentById(id: string) {
    const url = `${this.environment.api.segments}/status/${id}`;
    return this.http.get(url);
  }

  deleteSegment(id: string) {
    const url = `${this.environment.api.segments}/${id}`;
    return this.http.delete(url);
  }

  updateSegment(segment: SegmentInput_LEGACY) {
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

  exportSegmentCSV(segmentIds: string[]) {
    let ids = new HttpParams();
    segmentIds.forEach((id) => {
      ids = ids.append('ids', id.toString());
    });

    const url = this.environment.api.exportSegmentCSV;
    return this.http.get(url, { params: ids });
  }

  importSegments(segments: SegmentFile_LEGACY[]) {
    const url = this.environment.api.importSegments;
    return this.http.post(url, segments);
  }

  validateSegments(segments: SegmentFile_LEGACY[]) {
    const url = this.environment.api.validateSegments;
    return this.http.post(url, segments);
  }
}
