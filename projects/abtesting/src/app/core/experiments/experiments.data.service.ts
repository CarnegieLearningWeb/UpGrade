import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Experiment, EXPERIMENT_STATE } from './store/experiments.model';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClientService) {}

  getAllExperiment() {
    const url = environment.api.getAllExperiments;
    return this.http.get(url);
  }

  getAllExperimentsStats(experimentIds: string[]) {
    const url = environment.api.experimentsStats;
    return this.http.post(url, { 'experimentIds': experimentIds });
  }

  createNewExperiment(experiment: Experiment) {
    const url = environment.api.createNewExperiments;
    return this.http.post(url, { ...experiment });
  }

  updateExperiment(experiment: Experiment) {
    const url = `${environment.api.updateExperiments}/${experiment.id}`;
    return this.http.put(url, { ...experiment });
  }

  updateExperimentState(experimentId: string, experimentState: EXPERIMENT_STATE) {
    const url = environment.api.updateExperimentState;
    return this.http.put(url, { experimentId, state: experimentState });
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
