import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AnalysisService } from '../../../core/analysis/analysis.service';
import { ExperimentVM } from '../../../core/experiments/store/experiments.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-query-result',
  templateUrl: './query-result.component.html',
  styleUrls: ['./query-result.component.scss']
})
export class QueryResultComponent implements OnInit {

  experiment: ExperimentVM;
  queryResult$: Observable<any>;
  isQueryExecuting$ = this.analysisService.isQueryExecuting$;
  displayedConditionColumns = ['no', 'conditionCode', 'result'];

  constructor(
    private analysisService: AnalysisService,
    private dialogRef: MatDialogRef<QueryResultComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.experiment = this.data.experiment;
  }

  ngOnInit() {
    if (this.data.query) {
      const { id } = this.data.query;
      this.queryResult$ = this.analysisService.queryResultById$(id);
    }
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
