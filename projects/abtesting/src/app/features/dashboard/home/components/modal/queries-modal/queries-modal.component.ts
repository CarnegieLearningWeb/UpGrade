import { Component, OnInit, ChangeDetectionStrategy, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { QueryResultComponent } from '../query-result/query-result.component';

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
  constructor(
    private experimentService: ExperimentService,
    private analysisService: AnalysisService,
    private dialogRef: MatDialogRef<QueriesModalComponent>,
    private dialog: MatDialog,
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

  applyFilter(filterValue: string) {
    if (this.createQueryMode) {
      this.analysisService.setMetricsFilterValue(filterValue);
    } else {
      if (filterValue) {
        this.experimentQueries = this.experimentInfo.queries.filter(query => {
          // TODO: Change this logic
          if (query.metric) {
            return query.metric.key.split('@__@').join(' ').includes(filterValue);
          }
          return query.query.operationType.includes(filterValue);
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
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.analysisService.setMetricsFilterValue(null);
  }

}
