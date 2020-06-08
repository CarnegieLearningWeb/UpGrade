import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { METRICS_JOIN_TEXT } from '../../../../../../core/analysis/store/analysis.models';
import { OperationPipe } from '../../../../../../shared/pipes/operation.pipe';
import { QueryResultComponent } from '../../../../../../shared/components/query-result/query-result.component';

@Component({
  selector: 'app-queries-modal',
  templateUrl: './queries-modal.component.html',
  styleUrls: ['./queries-modal.component.scss'],
})
export class QueriesModalComponent implements OnInit, OnDestroy {

  experimentId: string;
  experimentInfo: ExperimentVM;
  experimentSub: Subscription;
  displayedColumns = ['id', 'metric', 'operation', 'execute'];
  createQueryMode = false;
  experimentQueries = [];
  searchInput = null;
  constructor(
    private experimentService: ExperimentService,
    private analysisService: AnalysisService,
    private dialogRef: MatDialogRef<QueriesModalComponent>,
    private dialog: MatDialog,
    private operationPipe: OperationPipe,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentId = this.data.experimentId;
  }

  ngOnInit() {
    this.experimentSub = this.experimentService.selectExperimentById(this.experimentId).subscribe(experiment => {
      this.experimentInfo = experiment;
      this.experimentQueries = experiment.queries;
    });
  }

  applyFilter(filterValue?: string) {
    const searchValue = filterValue && filterValue.toLowerCase() || this.searchInput.toLowerCase();
    if (this.createQueryMode) {
      this.analysisService.setMetricsFilterValue(searchValue);
    } else {
      if (searchValue) {
        this.experimentQueries = this.experimentInfo.queries.filter(query => {
          const operationPipedValue = this.operationPipe.transform(query.query.operationType).toLowerCase();
          return query.metric.key.toLowerCase().split(METRICS_JOIN_TEXT).join(' ').includes(searchValue)
            || operationPipedValue.includes(searchValue);
        });
      } else {
        this.experimentQueries = this.experimentInfo.queries;
      }
    }
  }

  executeQuery(query: any) {
    const dialogRef = this.dialog.open(QueryResultComponent, {
      panelClass: 'query-result',
      data: { experiment: this.experimentInfo, query }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after deleting experiment
    });
  }

  setCreateQueryMode() {
    this.createQueryMode = !this.createQueryMode;
    this.searchInput = '';
    this.applyFilter(); // Clear search input at the time of changing mode
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.analysisService.setMetricsFilterValue(null);
  }

  get METRICS_JOIN_TEXT() {
    return METRICS_JOIN_TEXT;
  }

}
