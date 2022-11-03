import { Inject, Injectable } from '@angular/core';
import { SegmentInput } from './store/segments.model';
import { HttpClient } from '@angular/common/http';
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

  exportSegment(segmentId: string) {
    const url = `${this.environment.api.exportSegment}/${segmentId}`;
    return this.http.get(url);
  }

  importSegment(segment: SegmentInput) {
    const url = this.environment.api.importSegment;
    return this.http.post(url, { ...segment });
  }
}
