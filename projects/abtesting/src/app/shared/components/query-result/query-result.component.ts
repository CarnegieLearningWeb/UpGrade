import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AnalysisService } from '../../../core/analysis/analysis.service';
import { ExperimentVM } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-query-result',
  templateUrl: './query-result.component.html',
  styleUrls: ['./query-result.component.scss']
})
export class QueryResultComponent implements OnInit, OnDestroy {

  experiment: ExperimentVM;
  experimentInfo: ExperimentVM;
  experimentInfoSub: Subscription;
  queryResult$: Observable<any>;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  displayedConditionColumns = ['no', 'conditionCode', 'result'];

  constructor(
    private analysisService: AnalysisService,
    private experimentService: ExperimentService,
    private dialogRef: MatDialogRef<QueryResultComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experiment = this.data.experiment;
    if (!this.data.experiment && this.data.query) {
      // Execute only if experiment is not provided
      const { id: experimentId } = this.data.query.experiment;
      this.experimentInfoSub = this.experimentService.selectExperimentById(experimentId).subscribe(exp => {
        this.experimentInfo = exp;
      });
    }
  }

  ngOnInit() {
    if (this.data.query) {
      const { id } = this.data.query;
      this.queryResult$ = this.analysisService.queryResultById$(id);
    }
  }

  ngOnDestroy() {
    if (this.experimentInfoSub) {
      this.experimentInfoSub.unsubscribe();
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  getConditionName(conditionId) {
    const experimentInfo = this.experiment || this.experimentInfo;
    if (experimentInfo) {
      const condition = experimentInfo.conditions.filter(
        con => con.id === conditionId
      )[0];
      return condition ? condition.conditionCode : '';
    }
    return '';
  }

}
