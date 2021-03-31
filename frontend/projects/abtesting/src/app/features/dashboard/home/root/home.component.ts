import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../components/modal/new-experiment/new-experiment.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { ImportExperimentComponent } from '../components/modal/import-experiment/import-experiment.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isInitialExperimentsLoading();

  constructor(
    private experimentService: ExperimentService,
    public dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.experimentService.loadExperiments(true);
  }

  openNewExperimentDialog() {
    const dialogRef = this.dialog.open(NewExperimentComponent, {
      panelClass: 'new-experiment-modal',
      disableClose : true
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  openImportExperimentDialog() {
    const dialogRef = this.dialog.open(ImportExperimentComponent, {
      panelClass: 'import-experiment-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }
}
