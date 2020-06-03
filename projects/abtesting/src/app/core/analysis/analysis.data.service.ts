import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AnalysisDataService {

  constructor(private http: HttpClient) {}
}
