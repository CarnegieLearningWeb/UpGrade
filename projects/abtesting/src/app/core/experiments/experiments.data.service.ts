import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Experiment, ExperimentStateInfo } from './store/experiments.model';
import { HttpClientService } from '../http/http-client.service';

const NUMBER_OF_EXPERIMENTS = 10;
@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClientService) {}

  getAllExperiment(skip: number, fromStarting: boolean, params: any) {
    const url = environment.api.getAllExperiments;
    const data: any = {
      skip: fromStarting ? 0 : skip,
      take: NUMBER_OF_EXPERIMENTS,
      ...params
    };
    return this.http.post(url, data);
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

  fetchAllPartitions() {
    const url = environment.api.allPartitions;
    return this.http.get(url);
  }

  fetchAllUniqueIdentifiers() {
    const url = environment.api.uniqueIdentifier;
    return this.http.get(url);
  }
}
