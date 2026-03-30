import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '@shared-component-lib';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experiment-details-page-header',
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './experiment-details-page-header.component.html',
  styleUrl: './experiment-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDetailsPageHeaderComponent {
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(private experimentService: ExperimentService) {}
}
