import { Inject, Injectable } from '@angular/core';
import {
  AddPrivateSegmentListRequest,
  EditPrivateSegmentListRequest,
  Segment,
  SegmentFile,
  SegmentInput,
  SegmentsPaginationInfo,
  SegmentsPaginationParams,
} from './store/segments.model';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';
import { FeatureFlagSegmentListDetails } from '../feature-flags/store/feature-flags.model';

@Injectable()
export class SegmentsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchAllSegments() {
    const url = this.environment.api.segments;
    return this.http.get(url);
  }

  fetchSegmentsPaginated(params: SegmentsPaginationParams): Observable<SegmentsPaginationInfo> {
    const url = this.environment.api.getPaginatedSegments;
    return this.http.post<SegmentsPaginationInfo>(url, params);
  }

  fetchGlobalSegments() {
    const url = this.environment.api.globalSegments;
    return this.http.get(url);
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

  // "legacy" import method for segment feature import
  validateSegments(segments: SegmentFile[]) {
    const url = this.environment.api.validateSegments;
    return this.http.post(url, segments);
  }

  // new import method for common modal
  validateSegmentsImport(segments: SegmentFile[]) {
    const url = this.environment.api.validateSegmentsImport;
    return this.http.post(url, segments);
  }

  addSegmentList(list: AddPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = this.environment.api.addSegmentList;

    // Transform AddPrivateSegmentListRequest to ListInputValidator format
    const transformedList = {
      parentSegmentId: list.id,
      name: list.segment.name,
      description: list.segment.description,
      context: list.segment.context,
      type: list.segment.type,
      userIds: list.segment.userIds,
      groups: list.segment.groups,
      subSegmentIds: list.segment.subSegmentIds,
      listType: list.listType,
    };

    // Return type transformation - adapting Segment to FeatureFlagSegmentListDetails
    return this.http.post<Segment>(url, transformedList).pipe(
      map((segment: Segment) => {
        return {
          segment: segment,
          featureFlag: null,
          enabled: list.enabled,
          listType: list.listType,
        } as FeatureFlagSegmentListDetails;
      })
    );
  }

  updateSegmentList(list: EditPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = this.environment.api.segments;

    // Transform EditPrivateSegmentListRequest to SegmentInputValidator format
    const transformedList = {
      id: list.segment.id,
      name: list.segment.name,
      description: list.segment.description,
      context: list.segment.context,
      type: list.segment.type,
      userIds: list.segment.userIds,
      groups: list.segment.groups,
      subSegmentIds: list.segment.subSegmentIds,
      listType: list.listType,
    };

    // Return type transformation - adapting Segment to FeatureFlagSegmentListDetails
    return this.http.post<Segment>(url, transformedList).pipe(
      map((segment: Segment) => {
        return {
          segment: segment,
          featureFlag: null,
          enabled: list.enabled,
          listType: list.listType,
        } as FeatureFlagSegmentListDetails;
      })
    );
  }

  deleteSegmentList(segmentId: string, parentSegmentId: string) {
    const url = `${this.environment.api.addSegmentList}/${segmentId}`;
    return this.http.delete(url, { body: { parentSegmentId } });
  }
}
