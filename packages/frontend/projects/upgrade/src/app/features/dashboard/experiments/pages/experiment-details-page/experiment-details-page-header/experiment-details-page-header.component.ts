import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '@shared-component-lib';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-experiment-details-page-header',
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './experiment-details-page-header.component.html',
  styleUrl: './experiment-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDetailsPageHeaderComponent {
  // Suppress the cached experiment name while the details page shows its error state,
  // so the breadcrumb doesn't display a stale name next to "not found"
  detailsName$: Observable<string> = combineLatest([
    this.experimentService.selectedExperiment$,
    this.experimentService.experimentDetailsPageError$,
  ]).pipe(map(([experiment, detailsPageError]) => (detailsPageError ? '' : experiment?.name ?? '')));

  constructor(private experimentService: ExperimentService) {}
}
