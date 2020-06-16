import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { METRICS_JOIN_TEXT, OPERATION_TYPES } from '../../../../../../core/analysis/store/analysis.models';
import { OperationPipe } from '../../../../../../shared/pipes/operation.pipe';
import { QueryResultComponent } from '../../../../../../shared/components/query-result/query-result.component';
import * as clonedeep from 'lodash.clonedeep';

@Component({
  selector: 'app-queries-modal',
  templateUrl: './queries-modal.component.html',
  styleUrls: ['./queries-modal.component.scss'],
})
export class QueriesModalComponent implements OnInit, OnDestroy {

  experimentInfo: ExperimentVM;
  experimentSub: Subscription;
  displayedColumns = ['id', 'queryName', 'metric', 'operation', 'execute', 'edit', 'delete'];
  createQueryMode = false;
  experimentQueries = [];
  searchInput = null;
  isExperimentLoading$ = this.experimentService.isLoadingExperiment$;

  // For editing query
  selectedQueryId = null;
  queryName: string;
  selectedOperation: OPERATION_TYPES;
  queryOperations = [];

  constructor(
    private experimentService: ExperimentService,
    private analysisService: AnalysisService,
    private dialogRef: MatDialogRef<QueriesModalComponent>,
    private dialog: MatDialog,
    private operationPipe: OperationPipe,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
  }

  ngOnInit() {
    this.experimentSub = this.experimentService.selectExperimentById(this.experimentInfo.id).subscribe(experiment => {
      this.experimentInfo = experiment;
      this.experimentQueries = experiment.queries;
    });
  }

  applyFilter(filterValue?: string) {
    this.resetVariables();
    const searchValue = filterValue && filterValue.toLowerCase() || this.searchInput.toLowerCase();
    if (this.createQueryMode) {
      this.analysisService.setMetricsFilterValue(searchValue);
    } else {
      if (searchValue) {
        this.experimentQueries = this.experimentInfo.queries.filter(query => {
          const operationPipedValue = this.operationPipe.transform(query.query.operationType).toLowerCase();
          return query.metric.key.toLowerCase().split(METRICS_JOIN_TEXT).join(' ').includes(searchValue)
            || operationPipedValue.includes(searchValue)
            || query.name.toLowerCase().includes(searchValue);
        });
      } else {
        this.experimentQueries = this.experimentInfo.queries;
      }
    }
  }

  executeQuery(query: any) {
    this.resetVariables();
    const dialogRef = this.dialog.open(QueryResultComponent, {
      panelClass: 'query-result',
      data: { experiment: this.experimentInfo, query }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after query result
    });
  }

  setCreateQueryMode() {
    this.createQueryMode = !this.createQueryMode;
    this.searchInput = '';
    this.applyFilter(); // Clear search input at the time of changing mode
  }

  deleteQuery(query: any) {
    this.experimentInfo.queries = this.experimentInfo.queries.filter(expQuery => expQuery.id !== query.id);
    this.experimentService.updateExperiment(this.experimentInfo);
  }

  editQuery(query: any) {
    this.selectedQueryId = query.id;
    this.queryName = query.name;
    this.selectedOperation = query.query.operationType;
    if (query.metric && query.metric.type === 'continuous') {
      this.queryOperations = [
        { value: OPERATION_TYPES.SUM, viewValue: 'Sum' },
        { value: OPERATION_TYPES.MIN, viewValue: 'Min' },
        { value: OPERATION_TYPES.MAX, viewValue: 'Max' },
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: OPERATION_TYPES.AVERAGE, viewValue: 'Average' },
        { value: OPERATION_TYPES.MODE, viewValue: 'Mode' },
        { value: OPERATION_TYPES.MEDIAN, viewValue: 'Median' },
        { value: OPERATION_TYPES.STDEV, viewValue: 'Standard Deviation' }
      ];
    } else if (query.metric && query.metric.type === 'categorical') {
      this.queryOperations = [
        { value: OPERATION_TYPES.COUNT, viewValue: 'Count' },
        { value: 'percent', viewValue: 'Percent' }
      ];
    }
  }

  updateQuery(query: any) {
    // console.log('Experiment ', this.experimentInfo);
    query = {
      ...query,
      name: this.queryName,
      query: {
        operationType: this.selectedOperation
      }
    };
    const cloneExperiment  = clonedeep(this.experimentInfo);
    cloneExperiment.queries = cloneExperiment.queries.map(expQuery => {
      return expQuery.id === query.id ? query : expQuery;
    });
    this.experimentService.updateExperiment(cloneExperiment);
    this.resetVariables();
  }

  resetVariables() {
    this.selectedQueryId = null;
    this.queryName = null;
    this.selectedOperation = null;
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.analysisService.setMetricsFilterValue(null);
  }

  get METRICS_JOIN_TEXT() {
    return METRICS_JOIN_TEXT;
  }

}
