import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Experiment, ExperimentStateInfo, ExperimentPaginationParams } from './store/experiments.model';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClientService) {}

  getAllExperiment(params: ExperimentPaginationParams) {
    const url = environment.api.getAllExperiments;
    return this.http.post(url, params);
  }

  getAllExperimentsStats(experimentIds: string[]) {
    const url = environment.api.experimentsStats;
    return this.http.post(url, { experimentIds: experimentIds });
  }

  createNewExperiment(experiment: Experiment) {
    const url = environment.api.createNewExperiments;
    return this.http.post(url, { ...experiment });
  }

  updateExperiment(experiment: Experiment) {
    const url = `${environment.api.updateExperiments}/${experiment.id}`;
    return this.http.put(url, { ...experiment });
  }

  updateExperimentState(experimentId: string, experimentStateInfo: ExperimentStateInfo) {
    const url = environment.api.updateExperimentState;
    return this.http.post(url, {
      experimentId,
      state: experimentStateInfo.newStatus,
      scheduleDate: experimentStateInfo.scheduleDate
    });
  }

  deleteExperiment(experimentId: string) {
    const url = `${environment.api.updateExperiments}/${experimentId}`;
    return this.http.delete(url);
  }

  getExperimentById(experimentId: string) {
    const url = `${environment.api.getExperimentById}/${experimentId}`;
    return this.http.get(url);
  }

  fetchAllPartitions() {
    const url = environment.api.allPartitions;
    return this.http.get(url);
  }

  fetchAllExperimentNames() {
    const url = environment.api.allExperimentNames;
    return this.http.get(url);
  }

  fetchExperimentContext() {
    const url = environment.api.experimentContext;
    return this.http.get(url);
  }

  exportExperimentInfo(experimentId: string) {
    const url = `${environment.api.generateCsv}/${experimentId}`;
    return this.http.get(url, 'text');
  }

  fetchExperimentGraphInfo(params: any) {
    const url = environment.api.experimentGraphInfo;
    return this.http.post(url, params);
  }
}
