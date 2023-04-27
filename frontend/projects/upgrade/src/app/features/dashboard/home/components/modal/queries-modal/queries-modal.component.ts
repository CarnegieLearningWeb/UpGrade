import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { METRICS_JOIN_TEXT, IMetricMetaData } from '../../../../../../core/analysis/store/analysis.models';
import { OperationPipe } from '../../../../../../shared/pipes/operation.pipe';
import { QueryResultComponent } from '../../../../../../shared/components/query-result/query-result.component';
import { UserPermission } from '../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-queries-modal',
  templateUrl: './queries-modal.component.html',
  styleUrls: ['./queries-modal.component.scss'],
})
export class QueriesModalComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionSub: Subscription;

  experimentInfo: ExperimentVM;
  experimentSub: Subscription;
  displayedColumns = ['id', 'queryName', 'metric', 'operation', 'repeatedMeasure', 'execute', 'delete'];
  createQueryMode = false;
  experimentQueries = [];
  searchInput = null;
  isExperimentLoading$ = this.experimentService.isLoadingExperiment$;

  constructor(
    private experimentService: ExperimentService,
    private analysisService: AnalysisService,
    private dialog: MatDialog,
    private operationPipe: OperationPipe,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
  }

  get METRICS_JOIN_TEXT() {
    return METRICS_JOIN_TEXT;
  }

  get IMetricMetadata() {
    return IMetricMetaData;
  }

  ngOnInit() {
    this.permissionSub = this.authService.userPermissions$.subscribe((permission) => (this.permissions = permission));
    this.experimentSub = this.experimentService.selectExperimentById(this.experimentInfo.id).subscribe((experiment) => {
      this.experimentInfo = experiment;
      this.experimentQueries = experiment.queries;
    });
  }

  applyFilter(filterValue?: string) {
    const searchValue =
      (filterValue && filterValue.toLowerCase()) || (this.searchInput && this.searchInput.toLowerCase()) || '';
    if (searchValue) {
      this.experimentQueries = this.experimentInfo.queries.filter((query) => {
        const operationPipedValue = this.operationPipe.transform(query.query.operationType).toLowerCase();
        return (
          query.metric.key.toLowerCase().split(METRICS_JOIN_TEXT).join(' ').includes(searchValue) ||
          operationPipedValue.includes(searchValue) ||
          query.name.toLowerCase().includes(searchValue)
        );
      });
    } else {
      this.experimentQueries = this.experimentInfo.queries;
    }
  }

  executeQuery(query: any) {
    this.analysisService.executeQuery([query.id]);
    const dialogRef = this.dialog.open(QueryResultComponent, {
      panelClass: 'query-result',
      data: { experiment: this.experimentInfo, query },
    });

    dialogRef.afterClosed().subscribe(() => {
      // Add code of further actions after query result
    });
  }

  setCreateQueryMode() {
    this.createQueryMode = !this.createQueryMode;
    this.searchInput = '';
    this.applyFilter(); // Clear search input at the time of changing mode
  }

  deleteQuery(query: any) {
    this.experimentInfo.queries = this.experimentInfo.queries.filter((expQuery) => expQuery.id !== query.id);
    this.experimentService.updateExperiment(this.experimentInfo);
  }

  createdQueryEvent() {
    this.createQueryMode = !this.createQueryMode;
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.analysisService.setMetricsFilterValue(null);
    this.permissionSub.unsubscribe();
  }
}
