import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Experiment } from './store/experiments.model';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClient) {}

  getAllExperiment(idToken: string) {
    const url = environment.api.getAllExperiments;
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.get(url, { headers });
  }

  getAllExperimentsStats(experimentIds: string[], idToken: string) {
    const url = environment.api.experimentsStats;
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.post(url, { experimentIds: experimentIds }, { headers });
  }

  createNewExperiment(experiment: Experiment, idToken: string) {
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    const url = environment.api.createNewExperiments;
    return this.http.post(url, { ...experiment }, { headers });
  }

  updateExperiment(experiment: Experiment, idToken: string) {
    const url = `${environment.api.updateExperiments}/${experiment.id}`;
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.put(url, { ...experiment }, { headers });
  }

  deleteExperiment(experimentId: string, idToken: string) {
    const url = `${environment.api.updateExperiments}/${experimentId}`;
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.delete(url, { headers });
  }
}
