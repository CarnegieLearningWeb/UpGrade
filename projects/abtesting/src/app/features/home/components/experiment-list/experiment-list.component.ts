import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent {
  allExperiments = this.experimentService.experiments$;

  constructor(private experimentService: ExperimentService) {}
}
