import { Inject, Injectable } from '@angular/core';
import { SegmentFile, SegmentInput, SegmentsPaginationInfo, SegmentsPaginationParams } from './store/segments.model';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class SegmentsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchSegmentsLegacyGetAll() {
    const url = this.environment.api.segments;
    return this.http.get(url);
  }

  fetchSegmentsPaginated(params: SegmentsPaginationParams): Observable<SegmentsPaginationInfo> {
    const url = this.environment.api.getPaginatedSegments;
    return this.http.post<SegmentsPaginationInfo>(url, params);
  }

  createNewSegment(segment: SegmentInput) {
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

  exportSegmentCSV(segmentIds: string[]) {
    let ids = new HttpParams();
    segmentIds.forEach((id) => {
      ids = ids.append('ids', id.toString());
    });

    const url = this.environment.api.exportSegmentCSV;
    return this.http.get(url, { params: ids });
  }

  importSegments(segments: SegmentFile[]) {
    const url = this.environment.api.importSegments;
    return this.http.post(url, segments);
  }

  validateSegments(segments: SegmentFile[]) {
    const url = this.environment.api.validateSegments;
    return this.http.post(url, segments);
  }
}
