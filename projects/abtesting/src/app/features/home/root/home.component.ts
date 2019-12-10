import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {

  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isLoadingExperiment$;
  constructor(private experimentService: ExperimentService) {
    this.experimentService.loadExperiments();
  }
}
