import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-analysis-root',
  templateUrl: './analysis-root.component.html',
  styleUrls: ['./analysis-root.component.scss']
})
export class AnalysisRootComponent implements OnInit {
  experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isInitialExperimentsLoading();

  constructor(
    private experimentService: ExperimentService,
  ) {}

  ngOnInit() {
    // Used to see whether experiments exists or not to show analysis view
    this.experimentService.loadExperiments(true);
  }
}
