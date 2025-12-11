import { Injectable } from '@angular/core';
import { Experiment, ExperimentStateInfo, ExperimentPaginationParams } from './store/experiments.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ExperimentFile } from '../../features/dashboard/home/components/modal/import-experiment/import-experiment.component';
import { API_ENDPOINTS } from '../api-endpoints.constants';

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

  validateExperiment(experiments: ExperimentFile[]) {
    const url = API_ENDPOINTS.validateExperiment;
    return this.http.post(url, experiments);
  }

  importExperiment(experiments: ExperimentFile[]) {
    const url = API_ENDPOINTS.importExperiment;
    return this.http.post(url, experiments);
  }

  updateExperiment(experiment: Experiment) {
    const url = `${API_ENDPOINTS.updateExperiments}/${experiment.id}`;
    return this.http.put(url, { ...experiment });
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    const url = API_ENDPOINTS.updateExperimentState;
    return this.http.post(url, {
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

  fetchContextMetaData() {
    const url = API_ENDPOINTS.contextMetaData;
    return this.http.get(url);
  }

  fetchGroupAssignmentStatus(experimentId: string) {
    const url = `${API_ENDPOINTS.getGroupAssignmentStatus}/${experimentId}`;
    return this.http.get(url);
  }
}
