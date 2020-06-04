import { Component, OnInit, ChangeDetectionStrategy, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';

@Component({
  selector: 'app-query-result',
  templateUrl: './query-result.component.html',
  styleUrls: ['./query-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryResultComponent implements OnInit, OnDestroy {

  experiment: ExperimentVM;
  queryResult$ = this.analysisService.queryResult$;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  displayedConditionColumns = ['no', 'conditionCode', 'result'];

  constructor(
    private analysisService: AnalysisService,
    private dialogRef: MatDialogRef<QueryResultComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experiment = this.data.experiment;
  }

  ngOnInit() {
    console.log('Data', this.data.query);
    console.log('Data', this.data);
    if (this.data.query) {
      const { id } = this.data.query;
      this.analysisService.executeQuery(id);
    }
  }

  ngOnDestroy() {
    this.analysisService.setQueryResult(null);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  getConditionName(conditionId) {
    if (this.experiment) {
      const condition = this.experiment.conditions.filter(
        con => con.id === conditionId
      )[0];
      return condition ? condition.conditionCode : '';
    }
    return '';
  }

}
