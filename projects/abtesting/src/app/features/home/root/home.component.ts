import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ExperimentService } from '../store/experiments/experiments.service';
import { Observable, of } from 'rxjs';
import { Experiment } from '../store/experiments/experiments.model';

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
