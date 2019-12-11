import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
import { SettingsService } from '../../../core/settings/settings.service';

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

  constructor(
    private experimentService: ExperimentService,
    private settingsService: SettingsService
  ) {
    this.experimentService.loadExperiments();
  }

  changeTheme(theme) {
    this.settingsService.changeTheme(theme);
  }
}
