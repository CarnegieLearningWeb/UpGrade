import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AddFeatureFlagRequest,
  FeatureFlag,
  FeatureFlagSegmentListDetails,
  FeatureFlagsPaginationInfo,
  FeatureFlagsPaginationParams,
  UpdateFeatureFlagRequest,
  UpdateFeatureFlagStatusRequest,
  UpdateFilterModeRequest,
} from './store/feature-flags.model';
import { Observable, delay, of } from 'rxjs';

import {
  AddPrivateSegmentListRequest,
  EditPrivateSegmentListRequest,
  SegmentFile,
} from '../segments/store/segments.model';
import { API_ENDPOINTS } from '../api-endpoints.constants';
import { IImportFile, LIST_FILTER_MODE } from 'upgrade_types';

@Injectable()
export class FeatureFlagsDataService {
  mockFeatureFlags: FeatureFlag[] = [];
  constructor(private http: HttpClient) {}

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams): Observable<FeatureFlagsPaginationInfo> {
    const url = API_ENDPOINTS.getPaginatedFlags;
    return this.http.post<FeatureFlagsPaginationInfo>(url, params);
  }

  fetchFeatureFlagById(id: string) {
    const url = `${API_ENDPOINTS.featureFlag}/${id}`;
    return this.http.get(url);
  }

  updateFeatureFlagStatus(params: UpdateFeatureFlagStatusRequest): Observable<FeatureFlag> {
    const url = API_ENDPOINTS.updateFlagStatus;
    return this.http.patch<FeatureFlag>(url, params);
  }

  addFeatureFlag(flag: AddFeatureFlagRequest): Observable<FeatureFlag> {
    const url = API_ENDPOINTS.featureFlag;
    return this.http.post<FeatureFlag>(url, flag);
  }

  updateFeatureFlag(flag: UpdateFeatureFlagRequest): Observable<FeatureFlag> {
    const url = `${API_ENDPOINTS.featureFlag}/${flag.id}`;
    return this.http.put<FeatureFlag>(url, flag);
  }

  validateFeatureFlag(featureFlags: { files: IImportFile[] }) {
    const url = API_ENDPOINTS.validateFeatureFlag;
    return this.http.post(url, featureFlags);
  }

  validateListsImport(segments: SegmentFile[]) {
    const url = API_ENDPOINTS.validateListsImport;
    return this.http.post(url, segments);
  }

  importFeatureFlag(featureFlag: { files: IImportFile[] }) {
    const url = API_ENDPOINTS.importFeatureFlag;
    return this.http.post(url, featureFlag);
  }

  importFeatureFlagList(files: IImportFile[], flagId: string, filterType: LIST_FILTER_MODE) {
    const lists = { files: files, filterType: filterType, flagId: flagId };
    const url = API_ENDPOINTS.importFeatureFlagList;
    return this.http.post(url, lists);
  }

  updateFilterMode(params: UpdateFilterModeRequest): Observable<FeatureFlag> {
    const url = API_ENDPOINTS.updateFilterMode;
    return this.http.patch<FeatureFlag>(url, params);
  }

  emailFeatureFlagData(flagId: string, email: string) {
    let featureFlagInfoParams = new HttpParams();
    featureFlagInfoParams = featureFlagInfoParams.append('experimentId', flagId);
    featureFlagInfoParams = featureFlagInfoParams.append('email', email);

    const url = API_ENDPOINTS.emailFlagData;
    // return this.http.post(url, { params: featureFlagInfoParams });

    // mock
    return of(true).pipe(delay(2000));
  }

  exportFeatureFlagsDesign(id: string) {
    const url = `${API_ENDPOINTS.exportFlagsDesign}/${id}`;
    return this.http.get(url);
  }

  exportAllIncludeListsDesign(id: string) {
    const url = `${API_ENDPOINTS.exportFFAllIncludeListsDesign}/${id}`;
    return this.http.get(url);
  }

  exportAllExcludeListsDesign(id: string) {
    const url = `${API_ENDPOINTS.exportFFAllExcludeListsDesign}/${id}`;
    return this.http.get(url);
  }

  deleteFeatureFlag(id: string) {
    const url = `${API_ENDPOINTS.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  addInclusionList(list: AddPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = API_ENDPOINTS.addFlagInclusionList;
    return this.http.post<FeatureFlagSegmentListDetails>(url, list);
  }

  updateInclusionList(list: EditPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = `${API_ENDPOINTS.addFlagInclusionList}/${list.segment.id}`;
    return this.http.put<FeatureFlagSegmentListDetails>(url, list);
  }

  deleteInclusionList(segmentId: string) {
    const url = `${API_ENDPOINTS.addFlagInclusionList}/${segmentId}`;
    return this.http.delete(url);
  }

  addExclusionList(list: AddPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = API_ENDPOINTS.addFlagExclusionList;
    return this.http.post<FeatureFlagSegmentListDetails>(url, list);
  }

  updateExclusionList(list: EditPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = `${API_ENDPOINTS.addFlagExclusionList}/${list.segment.id}`;
    return this.http.put<FeatureFlagSegmentListDetails>(url, list);
  }

  deleteExclusionList(segmentId: string) {
    const url = `${API_ENDPOINTS.addFlagExclusionList}/${segmentId}`;
    return this.http.delete(url);
  }
}
