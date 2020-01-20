import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../components/modal/new-experiment/new-experiment.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isLoadingExperiment$;

  constructor(
    private experimentService: ExperimentService,
    public dialog: MatDialog
  ) {}

  openNewExperimentDialog() {
    const dialogRef = this.dialog.open(NewExperimentComponent, {
      width: '50%',
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }
}
