import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
import { SettingsService } from '../../../core/settings/settings.service';
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
  theme$ = this.settingsService.theme$;

  themeOptions = [
    {value: ThemeOptions.DEFAULT_THEME, viewValue: 'Default'},
    {value: ThemeOptions.DARK_THEME, viewValue: 'Dark'},
    {value: ThemeOptions.LIGHT_THEME, viewValue: 'Light'},
    {value: ThemeOptions.NATURE_THEME, viewValue: 'Nature'}
  ];

  constructor(
    private experimentService: ExperimentService,
    private settingsService: SettingsService,
    public dialog: MatDialog
  ) {
    this.experimentService.loadExperiments();
  }

  changeTheme(theme) {
    this.settingsService.changeTheme(theme);
  }

  openNewExperimentDialog() {
    const dialogRef = this.dialog.open(NewExperimentComponent, {
      width: '50%',
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }
}
