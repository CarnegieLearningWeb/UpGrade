import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
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
import { LIST_FILTER_MODE, IFeatureFlagFile } from 'upgrade_types';

@Injectable()
export class FeatureFlagsDataService {
  mockFeatureFlags: FeatureFlag[] = [];
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams): Observable<FeatureFlagsPaginationInfo> {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post<FeatureFlagsPaginationInfo>(url, params);
  }

  fetchFeatureFlagById(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.get(url);
  }

  updateFeatureFlagStatus(params: UpdateFeatureFlagStatusRequest): Observable<FeatureFlag> {
    const url = this.environment.api.updateFlagStatus;
    return this.http.patch<FeatureFlag>(url, params);
  }

  addFeatureFlag(flag: AddFeatureFlagRequest): Observable<FeatureFlag> {
    const url = this.environment.api.featureFlag;
    return this.http.post<FeatureFlag>(url, flag);
  }

  updateFeatureFlag(flag: UpdateFeatureFlagRequest): Observable<FeatureFlag> {
    const url = `${this.environment.api.featureFlag}/${flag.id}`;
    return this.http.put<FeatureFlag>(url, flag);
  }

  validateFeatureFlag(featureFlags: { files: IFeatureFlagFile[] }) {
    const url = this.environment.api.validateFeatureFlag;
    return this.http.post(url, featureFlags);
  }

  validateListsImport(segments: SegmentFile[]) {
    const url = this.environment.api.validateListsImport;
    return this.http.post(url, segments);
  }

  importFeatureFlag(featureFlag: { files: IFeatureFlagFile[] }) {
    const url = this.environment.api.importFeatureFlag;
    return this.http.post(url, featureFlag);
  }

  importFeatureFlagList(files: IFeatureFlagFile[], flagId: string, filterType: LIST_FILTER_MODE) {
    const lists = { files: files, filterType: filterType, flagId: flagId };
    const url = this.environment.api.importFeatureFlagList;
    return this.http.post(url, lists);
  }

  updateFilterMode(params: UpdateFilterModeRequest): Observable<FeatureFlag> {
    const url = this.environment.api.updateFilterMode;
    return this.http.patch<FeatureFlag>(url, params);
  }

  emailFeatureFlagData(flagId: string, email: string) {
    let featureFlagInfoParams = new HttpParams();
    featureFlagInfoParams = featureFlagInfoParams.append('experimentId', flagId);
    featureFlagInfoParams = featureFlagInfoParams.append('email', email);

    const url = this.environment.api.emailFlagData;
    // return this.http.post(url, { params: featureFlagInfoParams });

    // mock
    return of(true).pipe(delay(2000));
  }

  exportFeatureFlagsDesign(id: string) {
    const url = `${this.environment.api.exportFlagsDesign}/${id}`;
    return this.http.get(url);
  }

  exportAllIncludeListsDesign(id: string) {
    const url = `${this.environment.api.exportFFAllIncludeListsDesign}/${id}`;
    return this.http.get(url);
  }

  exportAllExcludeListsDesign(id: string) {
    const url = `${this.environment.api.exportFFAllExcludeListsDesign}/${id}`;
    return this.http.get(url);
  }

  deleteFeatureFlag(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  addInclusionList(list: AddPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = this.environment.api.addFlagInclusionList;
    return this.http.post<FeatureFlagSegmentListDetails>(url, list);
  }

  updateInclusionList(list: EditPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = `${this.environment.api.addFlagInclusionList}/${list.segment.id}`;
    return this.http.put<FeatureFlagSegmentListDetails>(url, list);
  }

  deleteInclusionList(segmentId: string) {
    const url = `${this.environment.api.addFlagInclusionList}/${segmentId}`;
    return this.http.delete(url);
  }

  addExclusionList(list: AddPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = this.environment.api.addFlagExclusionList;
    return this.http.post<FeatureFlagSegmentListDetails>(url, list);
  }

  updateExclusionList(list: EditPrivateSegmentListRequest): Observable<FeatureFlagSegmentListDetails> {
    const url = `${this.environment.api.addFlagExclusionList}/${list.segment.id}`;
    return this.http.put<FeatureFlagSegmentListDetails>(url, list);
  }

  deleteExclusionList(segmentId: string) {
    const url = `${this.environment.api.addFlagExclusionList}/${segmentId}`;
    return this.http.delete(url);
  }
}
