import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../../core/core.state';
import { selectEffectiveTheme } from '../../../core/core.module';
import * as SettingsActions from '../../../core/settings/settings.actions';
import { ThemeOptions } from '../../../core/settings/settings.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  themes = [
    { label: 'Default', value: ThemeOptions.DEFAULT_THEME },
    { label: 'Dark', value: ThemeOptions.DARK_THEME },
    { label: 'Light', value: ThemeOptions.LIGHT_THEME },
    { label: 'Nature', value: ThemeOptions.NATURE_THEME }
  ];

  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isLoadingExperiment$;
  theme$ = this.store$.pipe(select(selectEffectiveTheme));

  constructor(
    private experimentService: ExperimentService,
    private store$: Store<AppState>
  ) {
    this.experimentService.loadExperiments();
  }

  changeTheme(theme) {
    this.store$.dispatch(SettingsActions.actionSettingsChangeTheme({ theme }));
  }
}
