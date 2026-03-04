import { Injectable } from '@angular/core';
import {
  Experiment,
  ExperimentStateInfo,
  ExperimentPaginationParams,
  UpdateExperimentFilterModeRequest,
  UpdateExperimentDecisionPointsRequest,
  UpdateExperimentMetricsRequest,
  ExperimentSegmentListResponse,
  UpdateExperimentConditionsRequest,
} from './store/experiments.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';
import { Observable } from 'rxjs';
import { ExperimentSegmentListRequest, SegmentFile } from '../segments/store/segments.model';
import { IImportFile, LIST_FILTER_MODE, ExperimentRewardsSummary } from 'upgrade_types';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClient) {}

  getAllExperiment(params: ExperimentPaginationParams) {
    const url = API_ENDPOINTS.getAllExperiments;
    return this.http.post(url, params);
  }

  getAllExperimentsStats(experimentIds: string[]) {
    const url = API_ENDPOINTS.experimentsStats;
    return this.http.post(url, { experimentIds: experimentIds });
  }

  getExperimentDetailStat(experimentId: string) {
    const url = API_ENDPOINTS.experimentDetailStat;
    return this.http.post(url, { experimentId });
  }

  createNewExperiment(experiment: Experiment) {
    const url = API_ENDPOINTS.createNewExperiments;
    return this.http.post(url, { ...experiment });
  }

  validateExperiment(experiments: IImportFile[]) {
    const url = API_ENDPOINTS.validateExperiment;
    return this.http.post(url, experiments);
  }

  importExperiment(experiments: IImportFile[]) {
    const url = API_ENDPOINTS.importExperiment;
    return this.http.post(url, experiments);
  }

  updateExperiment(experiment: Experiment) {
    const url = `${API_ENDPOINTS.updateExperiments}/${experiment.id}`;
    return this.http.put<Experiment>(url, { ...experiment });
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    const url = API_ENDPOINTS.updateExperimentState;
    return this.http.post<Experiment>(url, {
      experimentId,
      state: experimentStateInfo.newStatus,
      scheduleDate: experimentStateInfo.scheduleDate,
    });
  }

  deleteExperiment(experimentId: string) {
    const url = `${API_ENDPOINTS.updateExperiments}/${experimentId}`;
    return this.http.delete(url);
  }

  getExperimentById(experimentId: string) {
    const url = `${API_ENDPOINTS.getExperimentById}/${experimentId}`;
    return this.http.get(url);
  }

  fetchAllPartitions() {
    const url = API_ENDPOINTS.allPartitions;
    return this.http.get(url);
  }

  fetchAllExperimentNames() {
    const url = API_ENDPOINTS.allExperimentNames;
    return this.http.get(url);
  }

  exportExperimentInfo(experimentId: string, email: string) {
    let experimentInfoParams = new HttpParams();
    experimentInfoParams = experimentInfoParams.append('experimentId', experimentId.toString());
    experimentInfoParams = experimentInfoParams.append('email', email.toString());

    const url = API_ENDPOINTS.generateCsv;
    return this.http.get(url, { params: experimentInfoParams });
  }

  exportExperimentDesign(experimentIds: string[]) {
    let ids = new HttpParams();
    experimentIds.forEach((id) => {
      ids = ids.append('ids', id.toString());
    });

    const url = `${API_ENDPOINTS.exportExperiment}`;
    return this.http.get(url, { params: ids });
  }

  exportAllExperimentDesign() {
    const url = `${API_ENDPOINTS.exportAllExperiment}`;
    return this.http.get(url);
  }

  fetchExperimentGraphInfo(params: any) {
    const url = API_ENDPOINTS.experimentGraphInfo;
    return this.http.post(url, params);
  }

  addInclusionList(list: ExperimentSegmentListRequest): Observable<ExperimentSegmentListResponse> {
    const url = API_ENDPOINTS.addExperimentInclusionList;
    return this.http.post<ExperimentSegmentListResponse>(url, list);
  }

  updateInclusionList(list: ExperimentSegmentListRequest): Observable<ExperimentSegmentListResponse> {
    const url = `${API_ENDPOINTS.addExperimentInclusionList}/${list.list.id}`;
    return this.http.put<ExperimentSegmentListResponse>(url, list);
  }

  deleteInclusionList(segmentId: string) {
    const url = `${API_ENDPOINTS.addExperimentInclusionList}/${segmentId}`;
    return this.http.delete(url);
  }

  addExclusionList(list: ExperimentSegmentListRequest): Observable<ExperimentSegmentListResponse> {
    const url = API_ENDPOINTS.addExperimentExclusionList;
    return this.http.post<ExperimentSegmentListResponse>(url, list);
  }

  updateExclusionList(list: ExperimentSegmentListRequest): Observable<ExperimentSegmentListResponse> {
    const url = `${API_ENDPOINTS.addExperimentExclusionList}/${list.list.id}`;
    return this.http.put<ExperimentSegmentListResponse>(url, list);
  }

  deleteExclusionList(segmentId: string) {
    const url = `${API_ENDPOINTS.addExperimentExclusionList}/${segmentId}`;
    return this.http.delete(url);
  }

  fetchContextMetaData() {
    const url = API_ENDPOINTS.contextMetaData;
    return this.http.get(url);
  }

  fetchGroupAssignmentStatus(experimentId: string) {
    const url = `${API_ENDPOINTS.getGroupAssignmentStatus}/${experimentId}`;
    return this.http.get(url);
  }

  updateFilterMode(params: UpdateExperimentFilterModeRequest): Observable<Experiment> {
    const updatedExperiment = {
      ...params.experiment,
      filterMode: params.filterMode,
    };
    return this.updateExperiment(updatedExperiment);
  }

  updateExperimentDecisionPoints(params: UpdateExperimentDecisionPointsRequest): Observable<Experiment> {
    const updatedExperiment = {
      ...params.experiment,
      partitions: params.decisionPoints,
    };
    return this.updateExperiment(updatedExperiment);
  }

  updateExperimentConditions(params: UpdateExperimentConditionsRequest): Observable<Experiment> {
    const updatedExperiment = {
      ...params.experiment,
      conditions: params.conditions,
    };
    return this.updateExperiment(updatedExperiment);
  }

  validateListsImport(segments: SegmentFile[]) {
    const url = API_ENDPOINTS.validateListsImport;
    return this.http.post(url, segments);
  }

  importExperimentList(files: any[], experimentId: string, filterType: LIST_FILTER_MODE) {
    const lists = { files: files, filterType: filterType, experimentId: experimentId };
    const url = API_ENDPOINTS.importExperimentList;
    return this.http.post(url, lists);
  }

  exportAllExcludeListsDesign(id: string) {
    const url = `${API_ENDPOINTS.exportAllExperimentExcludeLists}/${id}`;
    return this.http.get(url);
  }

  exportAllIncludeListsDesign(id: string) {
    const url = `${API_ENDPOINTS.exportAllExperimentIncludeLists}/${id}`;
    return this.http.get(url);
  }

  updateExperimentMetrics(params: UpdateExperimentMetricsRequest): Observable<Experiment> {
    const updatedExperiment = {
      ...params.experiment,
      queries: params.metrics,
    };
    return this.updateExperiment(updatedExperiment);
  }

  fetchMoocletRewardsDataForExperiment(experimentId: string): Observable<ExperimentRewardsSummary> {
    const url = `${API_ENDPOINTS.getMoocletRewardsData}/${experimentId}`;
    return this.http.get<ExperimentRewardsSummary>(url);
  }
}
