import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { NewExperimentComponent } from '../components/modal/new-experiment/new-experiment.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { ImportExperimentComponent } from '../components/modal/import-experiment/import-experiment.component';
import { SegmentsService } from '../../../../core/segments/segments.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isInitialExperimentsLoading();

  constructor(
    private experimentService: ExperimentService,
    public dialog: MatDialog,
    private segmentsService: SegmentsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.experimentService.loadExperiments(true);
    this.segmentsService.fetchSegments(true);
  }

  openNewExperimentDialog() {
    this.dialog.open(NewExperimentComponent, {
      panelClass: 'new-experiment-modal',
      disableClose: true,
    });
  }

  openImportExperimentDialog() {
    this.dialog.open(ImportExperimentComponent, {
      panelClass: 'import-experiment-modal',
    });
  }
}
