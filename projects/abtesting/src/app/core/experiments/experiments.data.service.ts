import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class ExperimentDataService {
  constructor(private http: HttpClient) {}

  getAllExperiment() {
    const url = environment.api.getAllExperiments;
    return this.http.get(url);
  }
}
