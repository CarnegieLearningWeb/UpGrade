import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ExperimentService } from '../store/experiments/experiments.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  constructor(private experimentService: ExperimentService) {
    // load all experiment
    this.experimentService.loadExperiments();
    this.experimentService.experiments$.subscribe(data => {
      console.log('newData', data);
    });
  }

  ngOnInit() {}
}
