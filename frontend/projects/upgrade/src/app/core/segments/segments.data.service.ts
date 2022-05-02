import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SegmentVM } from './store/segments.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SegmentsDataService {
  constructor(private http: HttpClient) { }

  fetchSegments() {
    const url = environment.api.segments;
    return this.http.get(url);
  }

  createNewSegment(segment: SegmentVM) {
    const url = environment.api.segments;
    return this.http.post(url , segment);
  }

  deleteSegment(id: string) {
    const url = `${environment.api.segments}/${id}`;
    return this.http.delete(url);
  }

  updateSegment(segment: SegmentVM) {
    const url = environment.api.segments;
    return this.http.post(url , segment);
  }

  exportSegment(segmentId: string) {
    const url = `${environment.api.exportSegment}/${segmentId}`;
    return this.http.get(url);
  }

  importSegment(segment: SegmentVM) {
    const url = environment.api.importSegment;
    return this.http.post(url, {...segment});
  }
}
