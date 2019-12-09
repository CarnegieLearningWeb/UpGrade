import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Experiment } from '../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../core/experiments/experiments.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  // TODO: Will be un commented after experiments list view
  // experiments$: Observable<Experiment[]> = this.experimentService.experiments$;
  experiments$: Observable<Experiment[]> = of([]);
  constructor(private experimentService: ExperimentService) {
    // load all experiment
    this.experimentService.loadExperiments();
  }

  ngOnInit() {}
}
