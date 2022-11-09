import { Inject, Injectable } from '@angular/core';
import { Experiment, ExperimentStateInfo, ExperimentPaginationParams } from './store/experiments.model';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  getAllExperiment(params: ExperimentPaginationParams) {
    const url = this.environment.api.getAllExperiments;
    return this.http.post(url, params);
  }

  getAllExperimentsStats(experimentIds: string[]) {
    const url = this.environment.api.experimentsStats;
    return this.http.post(url, { experimentIds: experimentIds });
  }

  getExperimentDetailStat(experimentId: string) {
    const url = this.environment.api.experimentDetailStat;
    return this.http.post(url, { experimentId });
  }

  createNewExperiment(experiment: Experiment) {
    const url = this.environment.api.createNewExperiments;
    return this.http.post(url, { ...experiment });
  }

  importExperiment(experiments: Experiment[]) {
    const url = this.environment.api.importExperiment;
    return this.http.post(url, experiments);
  }

  updateExperiment(experiment: Experiment) {
    const url = `${this.environment.api.updateExperiments}/${experiment.id}`;
    return this.http.put(url, { ...experiment });
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    const url = this.environment.api.updateExperimentState;
    return this.http.post(url, {
      experimentId,
      state: experimentStateInfo.newStatus,
      scheduleDate: experimentStateInfo.scheduleDate,
    });
  }

  deleteExperiment(experimentId: string) {
    const url = `${this.environment.api.updateExperiments}/${experimentId}`;
    return this.http.delete(url);
  }

  getExperimentById(experimentId: string) {
    const url = `${this.environment.api.getExperimentById}/${experimentId}`;
    return this.http.get(url);
  }

  fetchAllPartitions() {
    const url = this.environment.api.allPartitions;
    return this.http.get(url);
  }

  fetchAllExperimentNames() {
    const url = this.environment.api.allExperimentNames;
    return this.http.get(url);
  }

  exportExperimentInfo(experimentId: string, email: string) {
    const url = this.environment.api.generateCsv;
    return this.http.post(url, { experimentId, email });
  }

  exportExperimentDesign(experimentIds: string[]) {
    const url = `${this.environment.api.exportExperiment}`;
    return this.http.post(url, experimentIds);
  }

  fetchExperimentGraphInfo(params: any) {
    const url = this.environment.api.experimentGraphInfo;
    return this.http.post(url, params);
  }

  fetchContextMetaData() {
    const url = this.environment.api.contextMetaData;
    return this.http.get(url);
  }

  fetchGroupAssignmentStatus(experimentId: string) {
    const url = `${this.environment.api.getGroupAssignmentStatus}/${experimentId}`;
    return this.http.get(url);
  }
}
